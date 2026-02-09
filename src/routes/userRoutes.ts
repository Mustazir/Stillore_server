import express from 'express';
import {
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  deleteUser
} from '../controllers/userController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id/block', blockUser);
router.put('/:id/unblock', unblockUser);
router.delete('/:id', deleteUser);

export default router;