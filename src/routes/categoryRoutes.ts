import express, { Request, Response } from "express";
import {
  createCategory,
  getCategories,
  getCategory,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { authenticate } from "../middlewares/authMiddleware";
import { requireAdmin } from "../middlewares/adminMiddleware";
import { upload } from "../middlewares/uploadMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

router.get("/", getCategories);
router.get("/:id", getCategory);
router.get("/slug/:slug", getCategoryBySlug);

// Upload image endpoint - MUST be before /:id route
router.post(
  "/upload-image",
  authenticate,
  requireAdmin,
  upload.single("imageFile"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file || !req.file.path) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    res.json({ success: true, url: req.file.path }); // ✅ Changed from urls to url
  }),
);

// Create/Update routes - NO upload.single() here
router.post("/", authenticate, requireAdmin, createCategory);
router.put("/:id", authenticate, requireAdmin, updateCategory);
router.delete("/:id", authenticate, requireAdmin, deleteCategory);

export default router;
