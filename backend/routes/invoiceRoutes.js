import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  recordInvoicePayment,
  deleteInvoice
} from '../controllers/invoiceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { managerOrCeo, ceoOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// List and create (manager or ceo)
router.get('/', managerOrCeo, getInvoices);
router.post('/', managerOrCeo, createInvoice);

// Single invoice
router.get('/:id', managerOrCeo, getInvoiceById);
router.put('/:id', managerOrCeo, updateInvoice);

// Record payment (manager or ceo)
router.post('/:id/payments', managerOrCeo, recordInvoicePayment);

// Delete - CEO only
router.delete('/:id', ceoOnly, deleteInvoice);

export default router;