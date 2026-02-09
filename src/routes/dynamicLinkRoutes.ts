import express from 'express';
import {
  getActiveDynamicLinks,
  getAllDynamicLinks,
  getDynamicLink,
  createDynamicLink,
  updateDynamicLink,
  toggleDynamicLink,
  deleteDynamicLink
} from '../controllers/dynamicLinkController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';

const router = express.Router();

router.get('/', getActiveDynamicLinks);

router.get('/all', authenticate, requireAdmin, getAllDynamicLinks);
router.get('/:id', authenticate, requireAdmin, getDynamicLink);
router.post('/', authenticate, requireAdmin, createDynamicLink);
router.put('/:id', authenticate, requireAdmin, updateDynamicLink);
router.put('/:id/toggle', authenticate, requireAdmin, toggleDynamicLink);
router.delete('/:id', authenticate, requireAdmin, deleteDynamicLink);

export default router;