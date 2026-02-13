import { Request, Response, NextFunction } from 'express';
import CountdownTimer from '../models/CountdownTimer';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../types';

// ========== PUBLIC - Get Active Timer ==========
export const getActiveTimer = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const timer = await CountdownTimer.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      timer,
    });
  }
);

// ========== ADMIN - Get All Timers ==========
export const getAllTimers = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const timers = await CountdownTimer.find().sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      timers,
    });
  }
);

// ========== ADMIN - Create Timer ==========
export const createTimer = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const timer = await CountdownTimer.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Countdown timer created successfully',
      timer,
    });
  }
);

// ========== ADMIN - Update Timer ==========
export const updateTimer = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const timer = await CountdownTimer.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!timer) {
      throw new ApiError(404, 'Timer not found');
    }

    res.json({
      success: true,
      message: 'Timer updated successfully',
      timer,
    });
  }
);

// ========== ADMIN - Delete Timer ==========
export const deleteTimer = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const timer = await CountdownTimer.findByIdAndDelete(id);

    if (!timer) {
      throw new ApiError(404, 'Timer not found');
    }

    res.json({
      success: true,
      message: 'Timer deleted successfully',
    });
  }
);

// ========== ADMIN - Toggle Active ==========
export const toggleTimerActive = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const timer = await CountdownTimer.findById(id);

    if (!timer) {
      throw new ApiError(404, 'Timer not found');
    }

    timer.isActive = !timer.isActive;
    await timer.save();

    res.json({
      success: true,
      message: `Timer ${timer.isActive ? 'activated' : 'deactivated'} successfully`,
      timer,
    });
  }
);