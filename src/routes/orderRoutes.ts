import express from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder
} from '../controllers/orderController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';
import { checkBlocked } from '../middlewares/blockMiddleware';

const router = express.Router();

router.post('/', authenticate, checkBlocked, createOrder);
router.get('/my', authenticate, getMyOrders);
router.get('/:id', authenticate, getOrder);
router.put('/:id/cancel', authenticate, cancelOrder);

router.get('/', authenticate, requireAdmin, getAllOrders);
router.put('/:id/status', authenticate, requireAdmin, updateOrderStatus);

export default router;