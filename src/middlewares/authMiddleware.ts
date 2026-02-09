import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { Admin } from '../models/Admin';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../types'; // Your extended Request type

interface JwtPayload {
  userId?: string;
  id?: string;
  role?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const token = req.headers.authorization?.startsWith('Bearer')
      ? req.headers.authorization.split(' ')[1]
      : undefined;

    if (!token) {
      throw new ApiError(401, 'No token provided. Please login.');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    let user;
    // If role is admin, fetch from Admin collection
    if (decoded.role === 'admin' && decoded.id) {
      user = await Admin.findById(decoded.id).select('-password');
    } else if (decoded.userId || decoded.id) {
      // Regular user
      const userId = decoded.userId || decoded.id;
      user = await User.findById(userId);
    }

    if (!user) {
      throw new ApiError(401, 'User not found. Invalid token.');
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token expired. Please login again.'));
    } else {
      next(error);
    }
  }
};
