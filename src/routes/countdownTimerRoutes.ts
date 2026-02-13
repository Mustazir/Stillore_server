import express from 'express';
import {
  getActiveTimer,
  getAllTimers,
  createTimer,
  updateTimer,
  deleteTimer,
  toggleTimerActive,
} from '../controllers/countdownTimerController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';

const router = express.Router();

// Public route
router.get('/', getActiveTimer);

// Admin routes
router.use(authenticate, requireAdmin);
router.get('/all', getAllTimers);
router.post('/', createTimer);
router.put('/:id', updateTimer);
router.delete('/:id', deleteTimer);
router.put('/:id/toggle', toggleTimerActive);

export default router;