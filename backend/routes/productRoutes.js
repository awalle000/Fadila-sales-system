import express from 'express';
import {
  addProduct,
  getProducts,
  getProduct,
  updateProductById,
  deleteProductById,
  adjustStock,
  getLowStock,
  getCategories
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { ceoOnly, managerOrCeo } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ✅ IMPORTANT: Specific routes MUST come before parameterized routes /:id
router.get('/categories', getCategories);
router.get('/alerts/low-stock', getLowStock);

// Routes accessible by Manager or CEO
router.get('/', getProducts);
router.post('/', managerOrCeo, addProduct);

// Parameterized routes - must come AFTER specific routes
router.get('/:id', getProduct);
router.put('/:id', managerOrCeo, updateProductById);
router.put('/:id/stock', managerOrCeo, adjustStock);

// CEO only routes
router.delete('/:id', ceoOnly, deleteProductById);

export default router;