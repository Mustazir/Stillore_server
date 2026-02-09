import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  const response: any = {
    success: false,
    message: message
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  console.error('❌ ERROR:', err);

  res.status(statusCode).json(response);
};