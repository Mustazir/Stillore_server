import type { Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../types';

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Admin access required');
  }

  next();
};

export const adminMiddleware = requireAdmin;