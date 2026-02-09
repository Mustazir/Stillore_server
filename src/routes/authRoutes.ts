import express from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import { authLimiter } from '../middlewares/rateLimiter';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

export default router;