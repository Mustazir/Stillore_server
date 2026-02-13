// src/controllers/categoryController.ts - UPDATED COMPLETE FILE
import { Request, Response, NextFunction } from "express";
import Category from "../models/Category";
import Product from "../models/Product";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../types";
import { categorySchema } from "../utils/validators";
import { deleteImageFromCloudinary } from "../utils/cloudinaryHelper";

// Helper function to generate slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
};

export const createCategory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { error } = categorySchema.validate(req.body);
    if (error) throw new ApiError(400, error.details[0].message);

    // ✨ Auto-generate slug from name
    const slug = generateSlug(req.body.name);

    // Check if category with same name, code, or slug already exists
    const existingCategory = await Category.findOne({
      $or: [
        { name: req.body.name },
        { code: req.body.code.toUpperCase() },
        { slug },
      ],
    });

    if (existingCategory) {
      if (existingCategory.name === req.body.name) {
        throw new ApiError(400, "Category with this name already exists");
      }
      if (existingCategory.code === req.body.code.toUpperCase()) {
        throw new ApiError(400, "Category with this code already exists");
      }
      if (existingCategory.slug === slug) {
        throw new ApiError(400, "Category with this slug already exists");
      }
    }

    const category = await Category.create({
      name: req.body.name,
      code: req.body.code.toUpperCase(),
      slug, // ✨ Add generated slug
      description: req.body.description || "",
      type: req.body.type || "category", // ✨ Add type field
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      image: req.body.image || "",
    });

    res.status(201).json({ success: true, category });
  },
);

export const getCategories = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { isActive } = req.query;

    const query: any = {};

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    } else {
      query.isActive = true;
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

    // ✨ If name is being updated, regenerate slug
    let slug = category.slug;
    if (req.body.name && req.body.name !== category.name) {
      slug = generateSlug(req.body.name);

      // Check if new slug already exists
      const existingCategory = await Category.findOne({
        slug,
        _id: { $ne: req.params.id },
      });
      if (existingCategory) {
        throw new ApiError(400, "Category with this name already exists");
      }
    }

    // Check if code already exists
    if (req.body.code && req.body.code.toUpperCase() !== category.code) {
      const existingCategory = await Category.findOne({
        code: req.body.code.toUpperCase(),
        _id: { $ne: req.params.id },
      });
      if (existingCategory) {
        throw new ApiError(400, "Category with this code already exists");
      }
    }

    const imageUrl = req.body.image || category.image;

    category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        code: req.body.code.toUpperCase(),
        slug, // ✨ Update slug
        description: req.body.description || "",
        type: req.body.type || category.type, // ✨ Update type
        isActive:
          req.body.isActive !== undefined
            ? req.body.isActive
            : category.isActive,
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

    // Delete image from Cloudinary
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
