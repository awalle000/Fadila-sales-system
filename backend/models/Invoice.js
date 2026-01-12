import mongoose from 'mongoose';

const invoicePaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: [0, 'Payment amount must be positive']
  },
  date: {
    type: Date,
    default: Date.now
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  note: {
    type: String,
    trim: true
  }
}, { _id: true });

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  finalAmount: { type: Number, required: true, min: 0 },
  unit: { type: String }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true },
  items: [invoiceItemSchema],
  totals: {
    totalAmount: { type: Number, default: 0, min: 0 },
    totalDiscount: { type: Number, default: 0, min: 0 },
    finalAmount: { type: Number, default: 0, min: 0 },
    totalProfit: { type: Number, default: 0 },
    totalItems: { type: Number, default: 0 }
  },
  saleDate: { type: Date, default: Date.now },
  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sellerName: { type: String },
  customerName: { type: String, default: 'Walk-in' },
  paymentType: { type: String, enum: ['cash', 'credit'], default: 'credit' },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  remainingBalance: { type: Number, default: 0, min: 0 },
  payments: [invoicePaymentSchema],
  dueDate: { type: Date, default: null },
  notes: { type: String, trim: true }
}, {
  timestamps: true
});

// Indexes for common queries
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ receiptNumber: 1 });
invoiceSchema.index({ customerName: 1 });
invoiceSchema.index({ status: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;