import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Changed from 100 to 1000
  message: 'Too many requests from this IP, please try again later.'
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Changed from 5 to 20
  message: 'Too many login attempts, please try again later.'
});