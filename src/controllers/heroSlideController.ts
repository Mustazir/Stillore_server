import { Request, Response, NextFunction } from "express";
import HeroSlide from "../models/HeroSlide";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../types";

// ========== PUBLIC - Get Active Slides ==========
export const getActiveSlides = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const slides = await HeroSlide.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    res.json({
      success: true,
      slides,
    });
  },
);

// ========== ADMIN - Get All Slides ==========
export const getAllSlides = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [slides, total] = await Promise.all([
      HeroSlide.find()
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      HeroSlide.countDocuments(),
    ]);

    res.json({
      success: true,
      slides,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  },
);

// ========== ADMIN - Get Single Slide ==========
export const getSlideById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const slide = await HeroSlide.findById(id);

    if (!slide) {
      throw new ApiError(404, "Slide not found");
    }

    res.json({
      success: true,
      slide,
    });
  },
);

// ========== ADMIN - Create Slide ==========
export const createSlide = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      title,
      subtitle,
      description,
      cta,
      link,
      type,
      mediaUrl,
      videoUrl, // ✨ NEW
      thumbnailUrl,
      duration,
      order,
      isActive,
    } = req.body;

    if (
      !title ||
      !subtitle ||
      !description ||
      !cta ||
      !link ||
      !type ||
      !mediaUrl
    ) {
      throw new ApiError(400, "All required fields must be provided");
    }

    if (!["image", "video"].includes(type)) {
      throw new ApiError(400, "Type must be either image or video");
    }

const slide = await HeroSlide.create({
  title,
  subtitle,
  description,
  cta,
  link,
  type,
  mediaUrl,
  thumbnailUrl,
  duration: duration || 5000,
  order: order || 0,
  isActive: isActive !== undefined ? isActive : true,
});

    res.status(201).json({
      success: true,
      message: "Slide created successfully",
      slide,
    });
  },
);

export const updateSlide = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const slide = await HeroSlide.findById(id);

    if (!slide) {
      throw new ApiError(404, "Slide not found");
    }

    const {
      title,
      subtitle,
      description,
      cta,
      link,
      type,
      mediaUrl,
      videoUrl, // ✨ NEW
      thumbnailUrl,
      duration,
      order,
      isActive,
    } = req.body;

    if (type && !["image", "video"].includes(type)) {
      throw new ApiError(400, "Type must be either image or video");
    }

const updatedSlide = await HeroSlide.findByIdAndUpdate(
  id,
  {
    title,
    subtitle,
    description,
    cta,
    link,
    type,
    mediaUrl,
    thumbnailUrl,
    duration,
    order,
    isActive,
  },
  { new: true, runValidators: true },
);

    res.json({
      success: true,
      message: "Slide updated successfully",
      slide: updatedSlide,
    });
  },
);

// ========== ADMIN - Delete Slide ==========
export const deleteSlide = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const slide = await HeroSlide.findById(id);

    if (!slide) {
      throw new ApiError(404, "Slide not found");
    }

    await slide.deleteOne();

    res.json({
      success: true,
      message: "Slide deleted successfully",
    });
  },
);

// ========== ADMIN - Toggle Slide Active Status ==========
export const toggleSlideActive = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const slide = await HeroSlide.findById(id);

    if (!slide) {
      throw new ApiError(404, "Slide not found");
    }

    slide.isActive = !slide.isActive;
    await slide.save();

    res.json({
      success: true,
      message: `Slide ${slide.isActive ? "activated" : "deactivated"} successfully`,
      slide,
    });
  },
);

// ========== ADMIN - Reorder Slides ==========
export const reorderSlides = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { slides } = req.body; // Array of {id, order}

    if (!Array.isArray(slides)) {
      throw new ApiError(400, "Slides must be an array");
    }

    // Update order for each slide
    const updatePromises = slides.map((slide: { id: string; order: number }) =>
      HeroSlide.findByIdAndUpdate(slide.id, { order: slide.order }),
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: "Slides reordered successfully",
    });
  },
);
