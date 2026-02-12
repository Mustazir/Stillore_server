import { Response } from "express";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../types";

const generateToken = (id: string): string => {
  return jwt.sign(
    { id, role: "admin" },
    process.env.JWT_SECRET || "your-secret-key",
    {
      expiresIn: "30d",
    },
  );
};

export const createAdmin = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { email, password, name } = req.body;

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      throw new ApiError(400, "Admin already exists");
    }

    const admin = await Admin.create({
      email,
      password,
      name,
      role: "admin",
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully! Please remove this route now.",
      data: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  },
);

export const loginAdmin = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Please provide email and password");
    }

    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isPasswordCorrect = await admin.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid credentials");
    }

    const token = generateToken(admin._id.toString());

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
        token,
      },
    });
  },
);
export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Please provide current and new password");
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, "New password must be at least 6 characters");
    }

    const admin = await Admin.findById(req.user!._id).select("+password");

    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }

    const isPasswordCorrect = await admin.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Current password is incorrect");
    }

    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  },
);

export const getAdminProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const admin = await Admin.findById(req.user!._id);

    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }

    res.json({
      success: true,
      data: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  },
);

// ========== FCM TOKEN MANAGEMENT ==========
export const saveFcmToken = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw new ApiError(400, 'FCM token is required');
    }

    const admin = await Admin.findById(req.user!._id);

    if (!admin) {
      throw new ApiError(404, 'Admin not found');
    }

    // Add token if not already exists
    if (!admin.fcmTokens.includes(token)) {
      admin.fcmTokens.push(token);
      await admin.save();
    }

    res.json({
      success: true,
      message: 'FCM token saved successfully',
    });
  }
);

export const removeFcmToken = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw new ApiError(400, 'FCM token is required');
    }

    const admin = await Admin.findById(req.user!._id);

    if (!admin) {
      throw new ApiError(404, 'Admin not found');
    }

    admin.fcmTokens = admin.fcmTokens.filter((t) => t !== token);
    await admin.save();

    res.json({
      success: true,
      message: 'FCM token removed successfully',
    });
  }
);