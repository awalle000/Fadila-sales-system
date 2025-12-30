import express from 'express';
import {
  getActivityLogs,
  getLoginLogs,
  getMyActivity,
  getMyLogins
} from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { ceoOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes for current user
router.get('/my-activity', getMyActivity);
router.get('/my-logins', getMyLogins);

// CEO only routes
router.get('/', ceoOnly, getActivityLogs);
router.get('/logins', ceoOnly, getLoginLogs);

export default router;