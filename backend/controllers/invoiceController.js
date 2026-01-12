import asyncHandler from 'express-async-handler';
import Invoice from '../models/Invoice.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { v4 as uuidv4 } from 'uuid';

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private (Manager or CEO)
export const createInvoice = asyncHandler(async (req, res) => {
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

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Invoice must include at least one item');
  }

  if (!totals || typeof totals.finalAmount !== 'number') {
    res.status(400);
    throw new Error('Invoice totals must be provided');
  }

  const invoiceReceipt = receiptNumber || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const initialRemaining = paymentType === 'cash' ? 0 : totals.finalAmount;
  const status = paymentType === 'cash' ? 'paid' : (initialRemaining === 0 ? 'paid' : 'pending');

  const invoice = await Invoice.create({
    receiptNumber: invoiceReceipt,
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

  res.status(201).json(populated);
});

// @desc    Get all invoices (with optional filters)
// @route   GET /api/invoices
// @access  Private (Manager or CEO)
export const getInvoices = asyncHandler(async (req, res) => {
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
});

// @desc    Get invoice by id
// @route   GET /api/invoices/:id
// @access  Private (Manager or CEO)
export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('soldBy', 'name email')
    .populate('payments.recordedBy', 'name email');

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  res.json(invoice);
});

// @desc    Update invoice metadata (dueDate, notes, customerName)
// @route   PUT /api/invoices/:id
// @access  Private (Manager or CEO)
export const updateInvoice = asyncHandler(async (req, res) => {
  const { dueDate, notes, customerName } = req.body;

  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
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
});

// @desc    Record a payment against an invoice (partial allowed)
// @route   POST /api/invoices/:id/payments
// @access  Private (Manager or CEO)
export const recordInvoicePayment = asyncHandler(async (req, res) => {
  const { amount, note } = req.body;
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  const pay = parseFloat(amount);
  if (isNaN(pay) || pay <= 0) {
    res.status(400);
    throw new Error('Invalid payment amount');
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
});

// @desc    Delete invoice (CEO only)
// @route   DELETE /api/invoices/:id
// @access  Private/CEO
export const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
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
});