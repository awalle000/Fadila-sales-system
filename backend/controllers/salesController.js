import asyncHandler from 'express-async-handler';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { calculateProfit, calculateTotalRevenue, formatCedis } from '../utils/calculateProfit.js';

// @desc    Record new sale
// @route   POST /api/sales
// @access  Private/Manager or CEO
export const recordSale = asyncHandler(async (req, res) => {
  const { productId, quantitySold, notes, discount = 0 } = req.body;

  if (!productId || !quantitySold || quantitySold <= 0) {
    res.status(400);
    throw new Error('Please provide valid product ID and quantity');
  }

  // ✅ Validate discount
  if (discount < 0) {
    res.status(400);
    throw new Error('Discount cannot be negative');
  }

  const product = await Product.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.quantityInStock < quantitySold) {
    res.status(400);
    throw new Error(`Insufficient stock. Available: ${product.quantityInStock} ${product.unit}`);
  }

  const unitPrice = parseFloat(product.sellingPrice);
  const costPrice = parseFloat(product.costPrice);
  const totalAmount = calculateTotalRevenue(unitPrice, quantitySold);
  const discountAmount = parseFloat(discount) || 0;

  // ✅ Validate discount doesn't exceed total
  if (discountAmount > totalAmount) {
    res.status(400);
    throw new Error('Discount cannot exceed total amount');
  }

  const finalAmount = totalAmount - discountAmount;
  
  // ✅ Calculate profit with discount applied
  // Profit = Final Amount - Cost
  const totalCost = costPrice * quantitySold;
  const profit = finalAmount - totalCost;

  const now = new Date();

  const sale = await Sale.create({
    product: product._id,
    productName: product.name,
    quantitySold,
    unitPrice,
    totalAmount,
    discount: discountAmount,
    finalAmount,
    costPrice,
    profit,
    soldBy: req.user._id,
    sellerName: req.user.name,
    saleDate: now,
    notes
  });

  // Update product stock
  product.quantityInStock -= quantitySold;
  await product.save();

  await ActivityLog.create({
    user: req.user._id,
    userName: req.user.name,
    action: 'SALE_RECORDED',
    details: discountAmount > 0 
      ? `Sold ${quantitySold} ${product.unit} of ${product.name} - Total: ${formatCedis(totalAmount)}, Discount: ${formatCedis(discountAmount)}, Final: ${formatCedis(finalAmount)}`
      : `Sold ${quantitySold} ${product.unit} of ${product.name} - Total: ${formatCedis(finalAmount)}`,
    ipAddress: req.ip
  });

  const populatedSale = await Sale.findById(sale._id)
    .populate('product', 'name category unit')
    .populate('soldBy', 'name email');

  res.status(201).json(populatedSale);
  console.log(`💰 Sale recorded: ${product.name} x${quantitySold} = ${formatCedis(finalAmount)} ${discountAmount > 0 ? `(Discount: ${formatCedis(discountAmount)})` : ''} at ${now}`);
});

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
export const getSales = asyncHandler(async (req, res) => {
  const { startDate, endDate, userId } = req.query;

  let query = {};

  if (startDate && endDate) {
    query.saleDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (userId) {
    query.soldBy = userId;
  }

  const sales = await Sale.find(query)
    .populate('product', 'name category unit')
    .populate('soldBy', 'name email')
    .sort({ saleDate: -1 });

  res.json(sales);
});

// @desc    Get sales by current user
// @route   GET /api/sales/my-sales
// @access  Private
export const getMySales = asyncHandler(async (req, res) => {
  const sales = await Sale.find({ soldBy: req.user._id })
    .populate('product', 'name category unit')
    .sort({ saleDate: -1 });

  res.json(sales);
});

// @desc    Get daily sales
// @route   GET /api/sales/daily/:date
// @access  Private
export const getDailySalesReport = asyncHandler(async (req, res) => {
  const { date } = req.params;
  
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const sales = await Sale.find({
    saleDate: { $gte: startDate, $lte: endDate }
  })
    .populate('product', 'name category unit')
    .populate('soldBy', 'name email')
    .sort({ saleDate: -1 });

  res.json(sales);
});

// @desc    Get monthly sales
// @route   GET /api/sales/monthly/:year/:month
// @access  Private
export const getMonthlySalesReport = asyncHandler(async (req, res) => {
  const { year, month } = req.params;
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const sales = await Sale.find({
    saleDate: { $gte: startDate, $lte: endDate }
  })
    .populate('product', 'name category unit')
    .populate('soldBy', 'name email')
    .sort({ saleDate: -1 });

  res.json(sales);
});

// @desc    Get top selling products
// @route   GET /api/sales/top-products
// @access  Private
export const getTopProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const topProducts = await Sale.aggregate([
    {
      $group: {
        _id: '$product',
        productName: { $first: '$productName' },
        totalSold: { $sum: '$quantitySold' },
        totalRevenue: { $sum: '$finalAmount' }, // ✅ Use finalAmount (after discount)
        totalProfit: { $sum: '$profit' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit }
  ]);

  res.json(topProducts);
});