import express from 'express';
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getMyReviews,
  getAllReviews,
  getReviewStats
} from '../controllers/reviewController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';
import { checkBlocked } from '../middlewares/blockMiddleware';
import { upload } from '../middlewares/uploadMiddleware';
import { canUserReview } from '../controllers/reviewController';

const router = express.Router();

// ========== PUBLIC ROUTES ==========
// Get reviews for a specific product
router.get('/product/:productId', getProductReviews);

// ========== USER PROTECTED ROUTES ==========
// Get my reviews
router.get('/my', authenticate, getMyReviews);
router.get('/can-review/:productId', authenticate, canUserReview);

// Create a review (only authenticated and non-blocked users)
router.post('/', authenticate, checkBlocked, upload.array('images', 3), createReview);

// Update my review (only authenticated and non-blocked users)
router.put('/:id', authenticate, checkBlocked, upload.array('images', 3), updateReview);

// Delete review (owner or admin)
router.delete('/:id', authenticate, deleteReview);

// ========== ADMIN ROUTES ==========
// Get all reviews (admin only)
router.get('/admin/all', authenticate, requireAdmin, getAllReviews);

// Get review statistics (admin only)
router.get('/admin/stats', authenticate, requireAdmin, getReviewStats);

export default router;