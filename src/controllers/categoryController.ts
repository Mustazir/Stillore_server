import { Request, Response, NextFunction } from "express";
import Category from "../models/Category";
import Product from "../models/Product";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../types";
import { categorySchema } from "../utils/validators";
import { deleteImageFromCloudinary } from "../utils/cloudinaryHelper";

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { error } = categorySchema.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  // ✅ FIX: Get image from body (already uploaded via /upload-image)
  const category = await Category.create({
    name: req.body.name,
    code: req.body.code,
    description: req.body.description || "",
    isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    image: req.body.image || "", // Image URL from frontend
  });

  res.status(201).json({ success: true, category });
});


export const getCategories = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { isActive } = req.query;

    const query: any = {};
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const categories = await Category.find(query).sort({ name: 1 });

    res.json({
      success: true,
      categories,
    });
  },
);

export const getCategory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    res.json({
      success: true,
      category,
    });
  },
);

export const getCategoryBySlug = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    res.json({
      success: true,
      category,
    });
  },
);

export const updateCategory = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let category = await Category.findById(req.params.id);

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    // ✅ FIX: Just use the image from body (already uploaded)
    const imageUrl = req.body.image || category.image;

    category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        code: req.body.code,
        description: req.body.description || "",
        isActive: req.body.isActive !== undefined ? req.body.isActive : category.isActive,
        image: imageUrl,
      },
      { new: true, runValidators: true },
    );

    res.json({
      success: true,
      category,
    });
  },
);

export const deleteCategory = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    const productCount = await Product.countDocuments({
      category: category.name,
    });

    if (productCount > 0) {
      throw new ApiError(
        400,
        `Cannot delete category. ${productCount} products are using this category.`,
      );
    }

    // ✅ Delete image from Cloudinary
    if (category.image) {
      await deleteImageFromCloudinary(category.image);
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  },
);
