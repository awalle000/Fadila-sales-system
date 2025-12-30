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

// Routes accessible by Manager or CEO
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/alerts/low-stock', getLowStock);
router.get('/:id', getProduct);
router.post('/', managerOrCeo, addProduct);
router.put('/:id', managerOrCeo, updateProductById);
router.put('/:id/stock', managerOrCeo, adjustStock);

// CEO only routes
router.delete('/:id', ceoOnly, deleteProductById);

export default router;