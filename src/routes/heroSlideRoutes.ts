// src/routes/heroSlideRoutes.ts
import express from 'express';
import {
  getActiveSlides,
  getAllSlides,
  getSlideById,
  createSlide,
  updateSlide,
  deleteSlide,
  toggleSlideActive,
  reorderSlides,
} from '../controllers/heroSlideController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';

const router = express.Router();

// ========== PUBLIC ROUTES ==========
router.get('/', getActiveSlides);

// ========== ADMIN ROUTES ==========
router.use(authenticate, requireAdmin);

router.get('/all', getAllSlides);
router.get('/:id', getSlideById);
router.post('/', createSlide);
router.put('/:id', updateSlide);
router.delete('/:id', deleteSlide);
router.put('/:id/toggle', toggleSlideActive);
router.put('/reorder/bulk', reorderSlides);

export default router;