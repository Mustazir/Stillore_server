import { Request, Response, NextFunction } from "express";
import Product from "../models/Product";
import Category from "../models/Category";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { generateProductSerial } from "../services/serialGenerator";
import { AuthRequest } from "../types";
import { productSchema } from "../utils/validators";
import cloudinary from "../config/cloudinary";
import { deleteImageFromCloudinary, deleteImagesFromCloudinary } from '../utils/cloudinaryHelper';

export const createProduct = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { error, value } = productSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const category = await Category.findById(value.category);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    const serial = await generateProductSerial(category.name);

    let images = value.images || [];
    if (req.files && Array.isArray(req.files)) {
      images = req.files.map((file: any) => file.path);
    }

    // ✅ FIX: Parse description if it's a string
    let description = value.description || { paragraph: "", bullets: [] };
    if (typeof description === "string") {
      description = { paragraph: description, bullets: [] };
    }

    const product = await Product.create({
      title: value.title,
      category: category.name,
      serial,
      price: value.price,
      discountPrice: value.discountPrice,
      sizes: value.sizes,
      status: value.status || "Available",
      description: description, // ✅ FIX
      images: images,
      gender: value.gender,
      season: value.season,
      tags: value.tags || [],
      isOffer: value.isOffer || false,
      discountPercent: value.discountPercent || 0,
      badgeText: value.badgeText,
      stock: value.stock,
    });

    const productWithCategory = {
      ...product.toObject(),
      categoryDetails: {
        _id: category._id,
        name: category.name,
        slug: category.slug,
      },
    };

    res.status(201).json({
      success: true,
      product: productWithCategory,
    });
  },
);

// src/controllers/productController.ts - UPDATED (Backend)
// Find the getProducts function and update the filter logic

export const getProducts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      page = 1,
      limit = 20,
      category,
      gender,
      season,
      minPrice,
      maxPrice,
      size,
      isOffer, // ✨ Will be 'true' or 'false' as string
      inStock,
      status,
      sort = '-createdAt',
      search,
    } = req.query;

    const query: any = {};

    if (category) query.category = category;
    if (gender) query.gender = gender;
    if (season) query.season = season;
    if (size) query.sizes = size;

    // ✨ FIXED - Handle isOffer filter properly
  if (isOffer === 'true') {
  query.isOffer = true;
}
    // If isOffer is undefined or empty string, don't add it to query

    // In Stock filter
    if (inStock === 'true') {
      query.status = 'Available';
      query.stock = { $gt: 0 };
    } else if (status) {
      query.status = status;
    }
 
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { serial: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort as string)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  }
);

export const searchProducts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      throw new ApiError(400, "Search query (q) is required");
    }

    const searchTerm = q as string;

    // Fuzzy search with flexible matching
    const query = {
      $or: [
        { title: new RegExp(searchTerm.split('').join('.*'), "i") },
        { serial: new RegExp(searchTerm, "i") },
        { tags: new RegExp(searchTerm, "i") },
        { category: new RegExp(searchTerm, "i") },
        { 'description.paragraph': new RegExp(searchTerm, "i") }  // ✅ Changed
      ],
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(query),
    ]);

    const productsWithCategory = await Promise.all(
      products.map(async (product) => {
        const category = await Category.findOne({ name: product.category });
        return {
          ...product,
          categoryDetails: category
            ? {
                _id: category._id,
                name: category.name,
                slug: category.slug,
              }
            : null,
        };
      }),
    );

    res.json({
      success: true,
      products: productsWithCategory,
      count: total,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  },
);

export const getProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const category = await Category.findOne({ name: product.category });

    const productWithCategory = {
      ...product,
      categoryDetails: category
        ? {
            _id: category._id,
            name: category.name,
            slug: category.slug,
          }
        : null,
    };

    res.json({
      success: true,
      product: productWithCategory,
    });
  },
);

export const updateProduct = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    delete req.body.serial;

    if (req.body.category) {
      let category: any = null;
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(req.body.category);

      if (isValidObjectId) {
        category = await Category.findById(req.body.category);
      }

      if (!category) {
        category =
          (await Category.findOne({ slug: req.body.category })) ||
          (await Category.findOne({ name: req.body.category }));
      }

      if (!category) {
        throw new ApiError(404, "Category not found");
      }

      req.body.category = category.name;
    }

    let images = product.images;

    // ✅ FIX: Delete old images when new images uploaded
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      if (product.images && product.images.length > 0) {
        await deleteImagesFromCloudinary(product.images);
      }
      images = req.files.map((file: any) => file.path);
    } else if (req.body.images && Array.isArray(req.body.images)) {
      // ✅ FIX: Handle image URL array from frontend
      const oldImages = product.images.filter(
        (img) => !req.body.images.includes(img),
      );
      if (oldImages.length > 0) {
        await deleteImagesFromCloudinary(oldImages);
      }
      images = req.body.images;
    }

    // ✅ FIX: Parse description if it's a string
    if (req.body.description && typeof req.body.description === "string") {
      req.body.description = { paragraph: req.body.description, bullets: [] };
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, images },
      {
        new: true,
        runValidators: true,
      },
    );

    const categoryDoc = await Category.findOne({ name: product!.category });

    const productWithCategory = {
      ...product!.toObject(),
      categoryDetails: categoryDoc
        ? {
            _id: categoryDoc._id,
            name: categoryDoc.name,
            slug: categoryDoc.slug,
          }
        : null,
    };

    res.json({
      success: true,
      product: productWithCategory,
    });
  },
);

export const deleteProduct = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // ✅ FIX: Delete all images from Cloudinary
    if (product.images && product.images.length > 0) {
      await deleteImagesFromCloudinary(product.images);
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  },
);

export const getProductsByCategory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { categorySlug } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const category = await Category.findOne({ slug: categorySlug });

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find({ category: category.name })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments({ category: category.name }),
    ]);

    const productsWithCategory = products.map((product) => ({
      ...product,
      categoryDetails: {
        _id: category._id,
        name: category.name,
        slug: category.slug,
      },
    }));

    res.json({
      success: true,
      products: productsWithCategory,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  },
);
