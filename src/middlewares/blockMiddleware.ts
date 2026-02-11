import type { Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../types';


export const checkBlocked = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }


  if ('isBlocked' in req.user && req.user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked. Contact support.');
  }

  next();
};