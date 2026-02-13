import { Request, Response, NextFunction } from 'express';
import OfferBanner from '../models/OfferBanner';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';

// ========== PUBLIC - Get Active Banners ==========
export const getActiveBanners = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const banners = await OfferBanner.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    res.json({
      success: true,
      banners,
    });
  }
);

// ========== ADMIN - Get All Banners ==========
export const getAllBanners = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const banners = await OfferBanner.find().sort({ order: 1 }).lean();

    res.json({
      success: true,
      banners,
    });
  }
);

// ========== ADMIN - Create Banner ==========
export const createBanner = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const banner = await OfferBanner.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Offer banner created successfully',
      banner,
    });
  }
);

// ========== ADMIN - Update Banner ==========
export const updateBanner = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const banner = await OfferBanner.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!banner) {
      throw new ApiError(404, 'Banner not found');
    }

    res.json({
      success: true,
      message: 'Banner updated successfully',
      banner,
    });
  }
);

// ========== ADMIN - Delete Banner ==========
export const deleteBanner = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const banner = await OfferBanner.findByIdAndDelete(id);

    if (!banner) {
      throw new ApiError(404, 'Banner not found');
    }

    res.json({
      success: true,
      message: 'Banner deleted successfully',
    });
  }
);

// ========== ADMIN - Toggle Active ==========
export const toggleBannerActive = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const banner = await OfferBanner.findById(id);

    if (!banner) {
      throw new ApiError(404, 'Banner not found');
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json({
      success: true,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
      banner,
    });
  }
);