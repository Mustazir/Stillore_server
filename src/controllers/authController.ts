import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import admin from "../config/firebase";
import User from "../models/User";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import type { AuthRequest } from "../types/index";
import { registerSchema, loginSchema } from "../utils/validators";

export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details?.[0]?.message || "Unknown error");
    }

    const { name, email, firebaseToken, photoURL } = value;

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

    if (decodedToken.email !== email) {
      throw new ApiError(400, "Email mismatch with Firebase token");
    }

    let user = await User.findOne({ email });

    if (user) {
      throw new ApiError(400, "User already exists with this email");
    }

    user = await User.create({
      name,
      email,
      photoURL,
      role: "user",
      isBlocked: false,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
      },
    });
  },
);

export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const { firebaseToken } = value;

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const email = decodedToken.email;

    if (!email) {
      throw new ApiError(400, "Email not found in Firebase token");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "User not found. Please register first.");
    }

    if (user.isBlocked) {
      throw new ApiError(
        403,
        "Your account has been blocked. Please contact support.",
      );
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isBlocked: user.isBlocked,
      },
    });
  },
);

export const getMe = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user!;

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isBlocked: user.isBlocked,
      },
    });
  },
);

export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { name, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { name, phone, address },
      { new: true, runValidators: true },
    );

    res.json({
      success: true,
      user,
    });
  },
);
