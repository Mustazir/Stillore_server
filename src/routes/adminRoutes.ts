import express from "express";
import {
  createAdmin,
  loginAdmin,
  getAdminProfile,
  changePassword,
} from "../controllers/adminController";
import {
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  deleteUser
} from '../controllers/userController';
import { authenticate } from "../middlewares/authMiddleware";
import { requireAdmin } from "../middlewares/adminMiddleware";

const router = express.Router();

// ========== ADMIN AUTH ROUTES (Public) ==========
// CREATE ADMIN ROUTE - USE ONLY ONCE THEN REMOVE/COMMENT THIS LINE
router.post("/create", createAdmin);

// Login route
router.post("/login", loginAdmin);

// ========== PROTECTED ADMIN ROUTES ==========
// Apply authentication and admin middleware to all routes below
router.use(authenticate);
router.use(requireAdmin);

// Admin Profile Management
router.get("/profile", getAdminProfile);
router.put("/change-password", changePassword);

// ========== USER MANAGEMENT ==========
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/unblock', unblockUser);
router.delete('/users/:id', deleteUser);

export default router;