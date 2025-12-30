// ✅ IMPORTANT: Load dotenv FIRST before any other imports that use env variables
import dotenv from 'dotenv';
dotenv.config();

// Now import everything else
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { connectDB } from './config/db.js';
import Product from './models/Product.js';
import Sale from './models/Sale.js';
import { formatCedis } from './utils/calculateProfit.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import activityRoutes from './routes/activityRoutes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activities', activityRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Soap Shop Sales System API - MongoDB',
    version: '1.0.0',
    status: 'Running',
    database: 'MongoDB',
    currency: 'Ghana Cedis (GH₵)',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      sales: '/api/sales',
      reports: '/api/reports',
      activities: '/api/activities'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ✅ AUTOMATED LOW STOCK ALERTS - Runs every day at 8 AM
cron.schedule('0 8 * * *', async () => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$quantityInStock', '$lowStockThreshold'] },
      isActive: true
    }).sort({ quantityInStock: 1 });
    
    if (lowStockProducts.length > 0) {
      console.log('\n⚠️  LOW STOCK ALERT ⚠️');
      console.log(`${lowStockProducts.length} product(s) are running low:\n`);
      
      lowStockProducts.forEach(product => {
        const status = product.quantityInStock === 0 ? '🔴 OUT OF STOCK' : '🟡 LOW STOCK';
        console.log(`${status} - ${product.name}: ${product.quantityInStock} ${product.unit} (Threshold: ${product.lowStockThreshold})`);
      });
      
      console.log('\n');
    } else {
      console.log('✅ All products are well-stocked');
    }
  } catch (error) {
    console.error('Error checking stock levels:', error);
  }
});

// ✅ DAILY SALES SUMMARY - Runs every day at 6 PM
cron.schedule('0 18 * * *', async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const stats = await Sale.aggregate([
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
    ]);
    
    const result = stats[0] || { transactions: 0, revenue: 0, profit: 0, itemsSold: 0 };
    
    console.log('\n📊 DAILY SALES SUMMARY');
    console.log(`Date: ${today.toDateString()}`);
    console.log(`Transactions: ${result.transactions}`);
    console.log(`Items Sold: ${result.itemsSold}`);
    console.log(`Revenue: ${formatCedis(result.revenue)}`);
    console.log(`Profit: ${formatCedis(result.profit)}\n`);
  } catch (error) {
    console.error('Error generating daily summary:', error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 ============================================');
  console.log(`   SOAP SHOP SALES SYSTEM (MongoDB)`);
  console.log(`   Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Currency: Ghana Cedis (GH₵)`);
  console.log('   ============================================');
  console.log('\n📌 API Endpoints:');
  console.log(`   - Auth:      http://localhost:${PORT}/api/auth`);
  console.log(`   - Products:  http://localhost:${PORT}/api/products`);
  console.log(`   - Sales:     http://localhost:${PORT}/api/sales`);
  console.log(`   - Reports:   http://localhost:${PORT}/api/reports`);
  console.log(`   - Activity:  http://localhost:${PORT}/api/activities`);
  console.log('\n⏰ Automated Tasks:');
  console.log('   - Low Stock Alerts: Daily at 8:00 AM');
  console.log('   - Sales Summary:    Daily at 6:00 PM');
  console.log('\n✅ Ready to accept requests!\n');
});