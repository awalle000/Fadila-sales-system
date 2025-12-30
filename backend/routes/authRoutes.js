import express from 'express';
import {
  login,
  logout,
  getMe,
  register,
  getUsers,
  updateUserById,
  deleteUserById,
  toggleStatus
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { ceoOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// CEO only routes
router.post('/register', protect, ceoOnly, register);
router.get('/users', protect, ceoOnly, getUsers);
router.put('/users/:id', protect, ceoOnly, updateUserById);
router.delete('/users/:id', protect, ceoOnly, deleteUserById);
router.put('/users/:id/toggle-status', protect, ceoOnly, toggleStatus);

export default router;