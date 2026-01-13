import asyncHandler from 'express-async-handler';
import Invoice from '../models/Invoice.js';
import Counter from '../models/Counter.js';
import { ActivityLog } from '../models/ActivityLog.js';

/**
 * Invoice Controller
 * - Year-based receipt number (auto resets yearly)
 * - Atomic counter (safe for millions of invoices)
 */

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private (Manager or CEO)
export const createInvoice = asyncHandler(async (req, res) => {
  try {
    const {
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

    // ✅ Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invoice must include at least one item' });
    }

    if (!totals || typeof totals.finalAmount !== 'number') {
      return res.status(400).json({ message: 'Invoice totals must include numeric finalAmount' });
    }

    // ✅ YEAR-BASED ATOMIC RECEIPT NUMBER (RESETS EVERY YEAR)
    const year = new Date().getFullYear();

    const counter = await Counter.findByIdAndUpdate(
      { _id: `invoice-${year}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // Supports up to 9,999,999 invoices per year
    const receiptNumber = `INV-${year}-${String(counter.seq).padStart(7, '0')}`;

    // ✅ Payment logic
    const remainingBalance =
      paymentType === 'cash' ? 0 : totals.finalAmount;

    const status =
      paymentType === 'cash' || remainingBalance === 0 ? 'paid' : 'pending';

    // ✅ Create invoice
    const invoice = await Invoice.create({
      receiptNumber,
      items,
      totals,
      saleDate: saleDate || new Date(),
      soldBy,
      sellerName,
      customerName: customerName || 'Walk-in',
      paymentType,
      status,
      remainingBalance,
      payments,
      dueDate: dueDate || null,
      notes: notes || ''
    });

    // ✅ Activity log
    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      action: 'INVOICE_CREATED',
      details: `Created invoice ${receiptNumber} - Total: ${totals.finalAmount}`,
      ipAddress: req.ip
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('soldBy', 'name email')
      .populate('payments.recordedBy', 'name email');

    return res.status(201).json(populated);

  } catch (err) {
    console.error('❌ Invoice creation error:', err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate invoice number detected. Please retry.'
      });
    }

    res.status(500).json({
      message: 'Server error while creating invoice'
    });
  }
});

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private (Manager or CEO)
export const getInvoices = asyncHandler(async (req, res) => {
  try {
    const { status, customerName, startDate, endDate } = req.query;
    let query = {};

    if (status) query.status = status;
    if (customerName) query.customerName = { $regex: customerName, $options: 'i' };
    if (startDate && endDate) {
      query.saleDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const invoices = await Invoice.find(query)
      .populate('soldBy', 'name email')
      .populate('payments.recordedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (err) {
    console.error('❌ Error in getInvoices:', err);
    res.status(500).json({ message: 'Server error retrieving invoices' });
  }
});

// @desc    Get invoice by id
// @route   GET /api/invoices/:id
export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('soldBy', 'name email')
    .populate('payments.recordedBy', 'name email');

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  res.json(invoice);
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
export const updateInvoice = asyncHandler(async (req, res) => {
  const { dueDate, notes, customerName } = req.body;
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  if (dueDate !== undefined) invoice.dueDate = dueDate || null;
  if (notes !== undefined) invoice.notes = notes;
  if (customerName !== undefined) invoice.customerName = customerName;

  await invoice.save();

  res.json(invoice);
});

// @desc    Record invoice payment
// @route   POST /api/invoices/:id/payments
export const recordInvoicePayment = asyncHandler(async (req, res) => {
  const { amount, note } = req.body;
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  const pay = parseFloat(amount);
  if (isNaN(pay) || pay <= 0) {
    return res.status(400).json({ message: 'Invalid payment amount' });
  }

  const effectivePayment = Math.min(pay, invoice.remainingBalance);

  invoice.payments.push({
    amount: effectivePayment,
    date: new Date(),
    recordedBy: req.user._id,
    note: note || ''
  });

  invoice.remainingBalance -= effectivePayment;
  invoice.status = invoice.remainingBalance === 0 ? 'paid' : 'pending';

  await invoice.save();
  res.json(invoice);
});

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
export const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  await Invoice.findByIdAndDelete(req.params.id);
  res.json({ message: 'Invoice deleted successfully' });
});
