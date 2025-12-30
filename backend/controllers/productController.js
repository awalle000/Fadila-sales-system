import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import { ActivityLog } from '../models/ActivityLog.js';

// @desc    Create new product
// @route   POST /api/products
// @access  Private/CEO or Manager
export const addProduct = asyncHandler(async (req, res) => {
  const { name, category, costPrice, sellingPrice, quantityInStock, lowStockThreshold, unit, description } = req.body;

  if (!name || !category || !costPrice || !sellingPrice) {
    res.status(400);
    throw new Error('Please provide name, category, cost price, and selling price');
  }

  if (costPrice < 0 || sellingPrice < 0) {
    res.status(400);
    throw new Error('Prices cannot be negative');
  }

  const product = await Product.create({
    name,
    category,
    costPrice,
    sellingPrice,
    quantityInStock: quantityInStock || 0,
    lowStockThreshold: lowStockThreshold || 10,
    unit: unit || 'pcs',
    description
  });

  await ActivityLog.create({
    user: req.user._id,
    userName: req.user.name,
    action: 'PRODUCT_CREATED',
    details: `Created product: ${name} - GH₵${sellingPrice}`,
    ipAddress: req.ip
  });

  res.status(201).json(product);
  console.log(`✅ New product added: ${name}`);
});

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true }).sort({ name: 1 });
  res.json(products);
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(product);
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/CEO or Manager
export const updateProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  await ActivityLog.create({
    user: req.user._id,
    userName: req.user.name,
    action: 'PRODUCT_UPDATED',
    details: `Updated product: ${updatedProduct.name}`,
    ipAddress: req.ip
  });

  res.json(updatedProduct);
  console.log(`✅ Product updated: ${updatedProduct.name}`);
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/CEO
export const deleteProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await Product.findByIdAndDelete(req.params.id);

  await ActivityLog.create({
    user: req.user._id,
    userName: req.user.name,
    action: 'PRODUCT_DELETED',
    details: `Deleted product: ${product.name}`,
    ipAddress: req.ip
  });

  res.json({ message: 'Product deleted successfully' });
  console.log(`🗑️ Product deleted: ${product.name}`);
});

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private/CEO or Manager
export const adjustStock = asyncHandler(async (req, res) => {
  const { quantityChange, reason } = req.body;

  if (quantityChange === undefined || quantityChange === 0) {
    res.status(400);
    throw new Error('Please provide quantity change');
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const newStock = product.quantityInStock + quantityChange;
  if (newStock < 0) {
    res.status(400);
    throw new Error(`Insufficient stock. Current stock: ${product.quantityInStock}`);
  }

  product.quantityInStock = newStock;
  await product.save();

  await ActivityLog.create({
    user: req.user._id,
    userName: req.user.name,
    action: 'STOCK_ADJUSTED',
    details: `${product.name}: ${quantityChange > 0 ? '+' : ''}${quantityChange} ${product.unit} (Reason: ${reason || 'Manual adjustment'})`,
    ipAddress: req.ip
  });

  res.json(product);
  console.log(`📦 Stock adjusted: ${product.name} ${quantityChange > 0 ? '+' : ''}${quantityChange}`);
});

// @desc    Get low stock products
// @route   GET /api/products/alerts/low-stock
// @access  Private
export const getLowStock = asyncHandler(async (req, res) => {
  const lowStockProducts = await Product.find({
    $expr: { $lte: ['$quantityInStock', '$lowStockThreshold'] },
    isActive: true
  }).sort({ quantityInStock: 1 });

  res.json(lowStockProducts);
});

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Private
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });
  res.json(categories.sort());
});