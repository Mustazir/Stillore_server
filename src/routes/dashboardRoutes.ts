import express from 'express';
import {
  getDashboardStats,
  getSalesChart,
  getTopProducts
} from '../controllers/dashboardController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/sales-chart', getSalesChart);
router.get('/top-products', getTopProducts);

export default router;