import asyncHandler from 'express-async-handler';
import Invoice from '../models/Invoice.js';
import { ActivityLog } from '../models/ActivityLog.js';

/**
 * Debug-friendly invoice controller
 * - Logs incoming payloads for create
 * - Validates required/expected fields and types
 * - Catches and logs errors with stack traces (helps identify 500 causes)
 */

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private (Manager or CEO)
export const createInvoice = asyncHandler(async (req, res) => {
  try {
    const {
      receiptNumber,
      items,
      totals,
      saleDate,
      soldBy,
      sellerName,
      customerName,
      paymentType = 'credit',
      payments = [],
      dueDate,
      notes
    } = req.body;

    // Log incoming payload for debugging (remove/reduce in production)
    console.log('📥 [INVOICE CREATE] payload:', JSON.stringify({
      receiptNumber,
      itemsLength: Array.isArray(items) ? items.length : items,
      totals,
      soldBy,
      sellerName,
      customerName,
      paymentType,
      paymentsLength: Array.isArray(payments) ? payments.length : payments,
      dueDate,
      notes
    }));

    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      return res.json({ message: 'Invoice must include at least one item' });
    }

    if (!totals || typeof totals.finalAmount !== 'number') {
      res.status(400);
      return res.json({ message: 'Invoice totals must include numeric finalAmount' });
    }

    // Create a receiving invoice number if not provided
    const invoiceReceipt = receiptNumber || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const initialRemaining = paymentType === 'cash' ? 0 : totals.finalAmount;
    const status = paymentType === 'cash' ? 'paid' : (initialRemaining === 0 ? 'paid' : 'pending');

    // IMPORTANT: set invoiceNumber as well to avoid unique-index errors on invoiceNumber field
    const invoice = await Invoice.create({
      receiptNumber: invoiceReceipt,
      invoiceNumber: invoiceReceipt, // <-- populate invoiceNumber to avoid null duplicates
      items,
      totals,
      saleDate: saleDate || new Date(),
      soldBy,
      sellerName,
      customerName: customerName || 'Walk-in',
      paymentType,
      status,
      remainingBalance: initialRemaining,
      payments: payments || [],
      dueDate: dueDate || null,
      notes: notes || ''
    });

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'INVOICE_CREATED',
      details: `Created invoice ${invoice.receiptNumber} for ${customerName || 'Walk-in'} - Total: ${totals.finalAmount}`,
      ipAddress: req.ip
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('soldBy', 'name email')
      .populate('payments.recordedBy', 'name email');

    return res.status(201).json(populated);
  } catch (err) {
    // Better logging for debugging
    console.error('❌ Error in createInvoice:', err && err.stack ? err.stack : err);
    // If it's a Mongoose validation or duplicate key error, send a helpful message
    if (err.name === 'ValidationError') {
      res.status(400);
      return res.json({ message: 'Invoice validation failed', details: err.message });
    }
    if (err.code === 11000) {
      res.status(400);
      return res.json({ message: 'Duplicate invoice (unique field conflict)', details: err.keyValue });
    }
    // Generic 500
    res.status(500);
    return res.json({ message: 'Server error while creating invoice. Check server logs for details.' });
  }
});

// @desc    Get all invoices (with optional filters)
// @route   GET /api/invoices
// @access  Private (Manager or CEO)
export const getInvoices = asyncHandler(async (req, res) => {
  try {
    const { status, customerName, startDate, endDate } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (customerName) {
      query.customerName = { $regex: customerName, $options: 'i' };
    }

    if (startDate && endDate) {
      query.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const invoices = await Invoice.find(query)
      .populate('soldBy', 'name email')
      .populate('payments.recordedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (err) {
    console.error('❌ Error in getInvoices:', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Server error retrieving invoices' });
  }
});

// @desc    Get invoice by id
// @route   GET /api/invoices/:id
// @access  Private (Manager or CEO)
export const getInvoiceById = asyncHandler(async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('soldBy', 'name email')
      .populate('payments.recordedBy', 'name email');

    if (!invoice) {
      res.status(404);
      return res.json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (err) {
    console.error('❌ Error in getInvoiceById:', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Server error retrieving invoice' });
  }
});

// @desc    Update invoice metadata (dueDate, notes, customerName)
// @route   PUT /api/invoices/:id
// @access  Private (Manager or CEO)
export const updateInvoice = asyncHandler(async (req, res) => {
  try {
    const { dueDate, notes, customerName } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404);
      return res.json({ message: 'Invoice not found' });
    }

    if (dueDate !== undefined) invoice.dueDate = dueDate || null;
    if (notes !== undefined) invoice.notes = notes;
    if (customerName !== undefined) invoice.customerName = customerName;

    await invoice.save();

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'INVOICE_UPDATED',
      details: `Updated invoice ${invoice.receiptNumber} (dueDate/notes/customer)`,
      ipAddress: req.ip
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('soldBy', 'name email')
      .populate('payments.recordedBy', 'name email');

    res.json(populated);
  } catch (err) {
    console.error('❌ Error in updateInvoice:', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Server error updating invoice' });
  }
});

// @desc    Record a payment against an invoice (partial allowed)
// @route   POST /api/invoices/:id/payments
// @access  Private (Manager or CEO)
export const recordInvoicePayment = asyncHandler(async (req, res) => {
  try {
    const { amount, note } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404);
      return res.json({ message: 'Invoice not found' });
    }

    const pay = parseFloat(amount);
    if (isNaN(pay) || pay <= 0) {
      res.status(400);
      return res.json({ message: 'Invalid payment amount' });
    }

    // Allow recording payment greater than remaining (will cap to 0)
    const effectivePayment = Math.min(pay, invoice.remainingBalance || invoice.totals.finalAmount);

    invoice.payments.push({
      amount: effectivePayment,
      date: new Date(),
      recordedBy: req.user._id,
      note: note || ''
    });

    invoice.remainingBalance = Math.max(0, (invoice.remainingBalance || invoice.totals.finalAmount) - effectivePayment);
    invoice.status = invoice.remainingBalance === 0 ? 'paid' : 'pending';

    await invoice.save();

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'INVOICE_PAYMENT',
      details: `Recorded payment of ${effectivePayment} for ${invoice.receiptNumber}. Remaining: ${invoice.remainingBalance}`,
      ipAddress: req.ip
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('soldBy', 'name email')
      .populate('payments.recordedBy', 'name email');

    res.json(populated);
  } catch (err) {
    console.error('❌ Error in recordInvoicePayment:', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Server error recording payment' });
  }
});

// @desc    Delete invoice (CEO only)
// @route   DELETE /api/invoices/:id
// @access  Private/CEO
export const deleteInvoice = asyncHandler(async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404);
      return res.json({ message: 'Invoice not found' });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'INVOICE_DELETED',
      details: `Deleted invoice ${invoice.receiptNumber}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    console.error('❌ Error in deleteInvoice:', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Server error deleting invoice' });
  }
});