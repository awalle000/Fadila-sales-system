import asyncHandler from 'express-async-handler';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import { generateDailyReport, generateMonthlyReport, generateProfitLossStatement } from '../utils/generateReport.js';
import { formatCedis } from '../utils/calculateProfit.js';

// @desc    Get daily report
// @route   GET /api/reports/daily/:date
// @access  Private
export const getDailyReport = asyncHandler(async (req, res) => {
  const { date } = req.params;
  
  // ✅ Debug: Check all sales in database
  const allSales = await Sale.find({}).limit(5).sort({ saleDate: -1 });
  console.log('🔍 Last 5 sales in database:', allSales.map(s => ({
    id: s._id,
    date: s.saleDate,
    product: s.productName,
    amount: s.totalAmount
  })));
  
  // ✅ Fix: Parse date correctly to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number);
  const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

  console.log('📅 Generating daily report for:', date);
  console.log('🕐 Start:', startDate);
  console.log('🕐 End:', endDate);

  const sales = await Sale.find({
    saleDate: { $gte: startDate, $lte: endDate }
  });

  console.log(`✅ Found ${sales.length} sales for ${date}`);
  if (sales.length > 0) {
    console.log('📦 Sales found:', sales.map(s => ({
      product: s.productName,
      qty: s.quantitySold,
      amount: s.totalAmount,
      date: s.saleDate
    })));
  }

  const report = generateDailyReport(sales);

  res.json({
    date,
    ...report
  });
});

// @desc    Get monthly report
// @route   GET /api/reports/monthly/:year/:month
// @access  Private
export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { year, month } = req.params;
  
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

  console.log('📅 Generating monthly report for:', `${year}-${month}`);
  console.log('🕐 Start:', startDate);
  console.log('🕐 End:', endDate);

  const sales = await Sale.find({
    saleDate: { $gte: startDate, $lte: endDate }
  });

  console.log(`✅ Found ${sales.length} sales for ${year}-${month}`);

  const report = generateMonthlyReport(sales);

  res.json({
    year,
    month,
    ...report
  });
});

// @desc    Get profit/loss statement
// @route   GET /api/reports/profit-loss
// @access  Private/CEO
export const getProfitLossReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, expenses } = req.query;

  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Please provide start date and end date');
  }

  // ✅ Fix: Parse dates correctly
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  
  const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
  const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

  console.log('📅 Generating P&L report from:', startDate, 'to:', endDate);

  const sales = await Sale.find({
    saleDate: { $gte: start, $lte: end }
  });

  console.log(`✅ Found ${sales.length} sales for P&L`);

  const statement = generateProfitLossStatement(sales, parseFloat(expenses) || 0);

  res.json({
    period: { startDate, endDate },
    ...statement
  });
});

// @desc    Get sales statistics
// @route   GET /api/reports/stats
// @access  Private
export const getSalesStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Please provide start date and end date');
  }

  // ✅ Fix: Parse dates correctly
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  
  const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
  const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

  const stats = await Sale.aggregate([
    {
      $match: {
        saleDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalItemsSold: { $sum: '$quantitySold' },
        totalRevenue: { $sum: '$totalAmount' },
        totalProfit: { $sum: '$profit' },
        totalCost: { $sum: { $multiply: ['$costPrice', '$quantitySold'] } }
      }
    }
  ]);

  const result = stats[0] || {
    totalTransactions: 0,
    totalItemsSold: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalCost: 0
  };

  res.json({
    period: { startDate, endDate },
    totalTransactions: result.totalTransactions,
    totalItemsSold: result.totalItemsSold,
    totalRevenue: formatCedis(result.totalRevenue),
    totalProfit: formatCedis(result.totalProfit),
    totalCost: formatCedis(result.totalCost),
    profitMargin: result.totalRevenue > 0 
      ? `${((result.totalProfit / result.totalRevenue) * 100).toFixed(2)}%` 
      : '0%',
    isProfitable: result.totalProfit > 0
  });
});

// @desc    Get inventory alerts
// @route   GET /api/reports/inventory-alerts
// @access  Private
export const getInventoryAlerts = asyncHandler(async (req, res) => {
  const lowStockProducts = await Product.find({
    $expr: { $lte: ['$quantityInStock', '$lowStockThreshold'] },
    isActive: true
  }).sort({ quantityInStock: 1 });

  const alerts = lowStockProducts.map(product => ({
    id: product._id,
    name: product.name,
    category: product.category,
    currentStock: product.quantityInStock,
    threshold: product.lowStockThreshold,
    unit: product.unit,
    alertLevel: product.quantityInStock === 0 ? 'CRITICAL' : 'LOW',
    message: product.quantityInStock === 0 
      ? `${product.name} is OUT OF STOCK!` 
      : `${product.name} is running low (${product.quantityInStock} ${product.unit} remaining)`
  }));

  res.json({
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => a.alertLevel === 'CRITICAL').length,
    alerts
  });
});

// @desc    Get dashboard overview
// @route   GET /api/reports/dashboard
// @access  Private
export const getDashboardOverview = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  const [todayStats, monthStats, lowStock] = await Promise.all([
    Sale.aggregate([
      { $match: { saleDate: { $gte: today, $lt: tomorrow } } },
      {
        $group: {
          _id: null,
          transactions: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          profit: { $sum: '$profit' },
          itemsSold: { $sum: '$quantitySold' }
        }
      }
    ]),
    Sale.aggregate([
      { $match: { saleDate: { $gte: monthStart, $lte: monthEnd } } },
      {
        $group: {
          _id: null,
          transactions: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          profit: { $sum: '$profit' },
          itemsSold: { $sum: '$quantitySold' }
        }
      }
    ]),
    Product.find({
      $expr: { $lte: ['$quantityInStock', '$lowStockThreshold'] },
      isActive: true
    })
  ]);

  const todayData = todayStats[0] || { transactions: 0, revenue: 0, profit: 0, itemsSold: 0 };
  const monthData = monthStats[0] || { transactions: 0, revenue: 0, profit: 0, itemsSold: 0 };

  res.json({
    today: {
      transactions: todayData.transactions,
      revenue: formatCedis(todayData.revenue),
      profit: formatCedis(todayData.profit),
      itemsSold: todayData.itemsSold
    },
    thisMonth: {
      transactions: monthData.transactions,
      revenue: formatCedis(monthData.revenue),
      profit: formatCedis(monthData.profit),
      itemsSold: monthData.itemsSold
    },
    alerts: {
      lowStockCount: lowStock.length,
      criticalCount: lowStock.filter(p => p.quantityInStock === 0).length
    }
  });
});