import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../types";

export const getAllUsers = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { page = 1, limit = 20, search, role, isBlocked } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: new RegExp(search as string, "i") },
        { email: new RegExp(search as string, "i") },
      ];
    }

    if (role) query.role = role;
    if (isBlocked !== undefined) query.isBlocked = isBlocked === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  },
);

export const getUserById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.json({
      success: true,
      user,
    });
  },
);

export const blockUser = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.role === "admin") {
      throw new ApiError(400, "Cannot block an admin user");
    }

    if (user.isBlocked) {
      throw new ApiError(400, "User is already blocked");
    }

    user.isBlocked = true;
    await user.save();

    res.json({
      success: true,
      message: "User blocked successfully",
      user,
    });
  },
);

export const unblockUser = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.isBlocked) {
      throw new ApiError(400, "User is not blocked");
    }

    user.isBlocked = false;
    await user.save();

    res.json({
      success: true,
      message: "User unblocked successfully",
      user,
    });
  },
);

export const deleteUser = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.role === "admin") {
      throw new ApiError(400, "Cannot delete an admin user");
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  },
);
