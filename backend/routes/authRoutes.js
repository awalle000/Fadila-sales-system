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
import { loginLimiter } from '../middleware/security.js';
import { validateLogin, validateUserRegistration } from '../middleware/validation.js';

const router = express.Router();

// ✅ Public routes with security
router.post('/login', loginLimiter, validateLogin, login);

// ✅ Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// ✅ CEO only routes with validation
router.post('/register', protect, ceoOnly, validateUserRegistration, register);
router.get('/users', protect, ceoOnly, getUsers);
router.put('/users/:id', protect, ceoOnly, validateUserRegistration, updateUserById);
router.delete('/users/:id', protect, ceoOnly, deleteUserById);
router.put('/users/:id/toggle-status', protect, ceoOnly, toggleStatus);

export default router;