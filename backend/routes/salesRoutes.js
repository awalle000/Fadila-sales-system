import express from 'express';
import {
  recordSale,
  getSales,
  getMySales,
  getDailySalesReport,
  getMonthlySalesReport,
  getTopProducts
} from '../controllers/salesController.js';
import { protect } from '../middleware/authMiddleware.js';
import { managerOrCeo } from '../middleware/roleMiddleware.js';
import { validateSaleInput } from '../middleware/validation.js';

const router = express.Router();

// ✅ All routes require authentication
router.use(protect);

// ✅ Sales routes with validation
router.post('/', managerOrCeo, validateSaleInput, recordSale);
router.get('/', getSales);
router.get('/my-sales', getMySales);
router.get('/daily/:date', getDailySalesReport);
router.get('/monthly/:year/:month', getMonthlySalesReport);
router.get('/top-products', getTopProducts);

export default router;