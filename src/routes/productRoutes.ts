// src/routes/productRoutes.ts - UPDATE
import express from 'express';
import {
  createProduct,
  getProducts,
  searchProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory
} from '../controllers/productController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';
import { upload, uploadMedia } from '../middlewares/uploadMiddleware'; // ✨ Add uploadMedia

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/category/:categorySlug', getProductsByCategory);
router.get('/:id', getProduct);

// Image upload endpoint (admin only) - for products
router.post('/upload-images', authenticate, requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ success: false, message: 'No images provided' });
    }

    const urls = req.files.map((file: any) => file.path);

    res.json({
      success: true,
      urls,
      message: 'Images uploaded successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✨ NEW - Media upload endpoint (admin only) - for hero slides (images and videos)
router.post('/upload-media', authenticate, requireAdmin, uploadMedia.array('images', 1), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ success: false, message: 'No media provided' });
    }

    const urls = req.files.map((file: any) => file.path);

    res.json({
      success: true,
      urls,
      message: 'Media uploaded successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Product CRUD (admin only)
router.post('/', authenticate, requireAdmin, upload.array('images', 5), createProduct);
router.put('/:id', authenticate, requireAdmin, upload.array('images', 5), updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;