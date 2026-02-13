import express from 'express';
import {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
} from '../controllers/offerBannerController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';

const router = express.Router();

// Public route
router.get('/', getActiveBanners);

// Admin routes
router.use(authenticate, requireAdmin);
router.get('/all', getAllBanners);
router.post('/', createBanner);
router.put('/:id', updateBanner);
router.delete('/:id', deleteBanner);
router.put('/:id/toggle', toggleBannerActive);

export default router;