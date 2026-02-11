// Backend: src/controllers/reviewController.ts
import { Request, Response, NextFunction } from "express";
import Review from "../models/Review";
import Product from "../models/Product";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../types";
import Order from '../models/Order';

// ========== USER REVIEW OPERATIONS ==========
const userHasPurchasedProduct = async (
  userId: string,
  productId: string,
): Promise<boolean> => {
  const order = await Order.findOne({
    userId: userId,
    "products.productId": productId,
    status: "Delivered",
  });

  return !!order;
};

export const createReview = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { productId, rating, comment } = req.body;

    // Validation
    if (!productId || !rating || !comment) {
      throw new ApiError(400, 'Product ID, rating, and comment are required');
    }

    if (rating < 1 || rating > 5) {
      throw new ApiError(400, 'Rating must be between 1 and 5');
    }

    if (comment.length < 10) {
      throw new ApiError(400, 'Comment must be at least 10 characters');
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Check if user purchased this product
    const hasPurchased = await userHasPurchasedProduct(
      req.user!._id.toString(),
      productId,
    );
    if (!hasPurchased) {
      throw new ApiError(
        403,
        "You can only review products you have purchased and received",
      );
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      productId,
      userId: req.user!._id,
    });

    if (existingReview) {
      throw new ApiError(400, 'You have already reviewed this product');
    }

    // Handle images
    let images: string[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      images = req.files.map((file: any) => file.path);
    }

    // Create review
    const review = await Review.create({
      productId,
      userId: req.user!._id,
      userName: req.user!.name,
      userPhoto: req.user!.photoURL,
      rating: Number(rating),
      comment: comment.trim(),
      images,
    });

    // Update product rating and review count
    const reviews = await Review.find({ productId });
    const totalReviews = reviews.length;
    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: totalReviews,
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  },
);

export const canUserReview = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { productId } = req.params;

    const existingReview = await Review.findOne({
      productId,
      userId: req.user!._id,
    });

    if (existingReview) {
      return res.json({
        success: true,
        canReview: false,
        reason: "already_reviewed",
        message: "You have already reviewed this product",
      });
    }

    const hasPurchased = await userHasPurchasedProduct(
      req.user!._id.toString(),
      productId,
    );

    if (!hasPurchased) {
      return res.json({
        success: true,
        canReview: false,
        reason: "not_purchased",
        message: "You can only review products you have purchased and received",
      });
    }

    res.json({
      success: true,
      canReview: true,
      message: "You can review this product",
    });
  },
);

export const getProductReviews = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ productId })
        .sort(sort as string)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Review.countDocuments({ productId }),
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  },
);

export const updateReview = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(id);

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    // Check if user is the owner
    if (review.userId.toString() !== req.user!._id.toString()) {
      throw new ApiError(403, "Not authorized to update this review");
    }

    if (rating && (rating < 1 || rating > 5)) {
      throw new ApiError(400, "Rating must be between 1 and 5");
    }

    if (comment && comment.length < 10) {
      throw new ApiError(400, "Comment must be at least 10 characters");
    }

    let images = review.images;
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      images = req.files.map((file: any) => file.path);
    } else if (req.body.images) {
      images = Array.isArray(req.body.images)
        ? req.body.images
        : [req.body.images];
    }

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      {
        rating: rating || review.rating,
        comment: comment || review.comment,
        images,
      },
      { new: true },
    );

    // Update product rating and review count
    const reviews = await Review.find({ productId: review.productId });
    const totalReviews = reviews.length;
    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    await Product.findByIdAndUpdate(review.productId, {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: totalReviews,
    });

    res.json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview,
    });
  },
);

export const deleteReview = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    // Check if user is the owner or admin
    const isOwner = review.userId.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new ApiError(403, "Not authorized to delete this review");
    }

    await review.deleteOne();

    // Update product rating and review count
    const reviews = await Review.find({ productId: review.productId });
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    await Product.findByIdAndUpdate(review.productId, {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: totalReviews,
    });

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  },
);

export const getMyReviews = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ userId: req.user!._id })
        .populate("productId", "title images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Review.countDocuments({ userId: req.user!._id }),
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  },
);

// ========== ADMIN REVIEW OPERATIONS ==========

export const getAllReviews = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find()
        .select(
          "productId userId userName userPhoto rating comment images createdAt",
        )
        .populate("productId", "title images")
        .sort(sort as string)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Review.countDocuments(),
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  },
);

export const getReviewStats = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const totalReviews = await Review.countDocuments();

    const ratingStats = await Review.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    const averageRating = await Review.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    const recentReviews = await Review.find()
      .populate("productId", "title images")
      .populate("userId", "name photoURL")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      stats: {
        total: totalReviews,
        average: averageRating[0]?.avgRating || 0,
        byRating: ratingStats,
        recent: recentReviews,
      },
    });
  },
);