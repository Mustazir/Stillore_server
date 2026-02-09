import { Request, Response, NextFunction } from 'express';
import DynamicLink from '../models/DynamicLink';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';

export const getActiveDynamicLinks = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const links = await DynamicLink.find({ isActive: true }).sort({ order: 1 }).lean();

    res.json({
      success: true,
      links
    });
  }
);

export const getAllDynamicLinks = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const links = await DynamicLink.find().sort({ order: 1 }).lean();

    res.json({
      success: true,
      links
    });
  }
);

export const getDynamicLink = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const link = await DynamicLink.findById(req.params.id);

    if (!link) {
      throw new ApiError(404, 'Dynamic link not found');
    }

    res.json({
      success: true,
      link
    });
  }
);

export const createDynamicLink = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { label, type, value, path, isActive, order } = req.body;

    if (!label || !type || !value) {
      throw new ApiError(400, 'Label, type, and value are required');
    }

    const link = await DynamicLink.create({
      label,
      type,
      value,
      path: type === 'custom' ? path : undefined,
      isActive: isActive || false,
      order: order || 0
    });

    res.status(201).json({
      success: true,
      link
    });
  }
);

export const updateDynamicLink = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let link = await DynamicLink.findById(req.params.id);

    if (!link) {
      throw new ApiError(404, 'Dynamic link not found');
    }

    link = await DynamicLink.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      link
    });
  }
);

export const toggleDynamicLink = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const link = await DynamicLink.findById(req.params.id);

    if (!link) {
      throw new ApiError(404, 'Dynamic link not found');
    }

    link.isActive = !link.isActive;
    await link.save();

    res.json({
      success: true,
      link,
      message: `Dynamic link ${link.isActive ? 'activated' : 'deactivated'} successfully`
    });
  }
);

export const deleteDynamicLink = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const link = await DynamicLink.findById(req.params.id);

    if (!link) {
      throw new ApiError(404, 'Dynamic link not found');
    }

    await link.deleteOne();

    res.json({
      success: true,
      message: 'Dynamic link deleted successfully'
    });
  }
);