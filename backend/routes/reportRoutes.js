import express from 'express';
import {
  getDailyReport,
  getMonthlyReport,
  getProfitLossReport,
  getSalesStatistics,
  getInventoryAlerts,
  getDashboardOverview
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { ceoOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Report routes
router.get('/daily/:date', getDailyReport);
router.get('/monthly/:year/:month', getMonthlyReport);
router.get('/stats', getSalesStatistics);
router.get('/inventory-alerts', getInventoryAlerts);
router.get('/dashboard', getDashboardOverview);

// CEO only routes
router.get('/profit-loss', ceoOnly, getProfitLossReport);

export default router;