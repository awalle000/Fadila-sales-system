import api from './api';

/* --------------------------------------------------
   🔐 SIMPLE IN-MEMORY CACHE
-------------------------------------------------- */

const cache = {
  products: { data: null, time: 0 },
  lowStock: { data: null, time: 0 },
  categories: { data: null, time: 0 }
};

const CACHE_TTL = 15000; // 15 seconds

const isCacheValid = (entry) =>
  entry.data && Date.now() - entry.time < CACHE_TTL;

/* --------------------------------------------------
   PRODUCTS
-------------------------------------------------- */

export const getAllProducts = async () => {
  if (isCacheValid(cache.products)) {
    return cache.products.data;
  }

  try {
    const response = await api.get('/products');
    cache.products = { data: response.data || [], time: Date.now() };
    return cache.products.data;
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
};

export const getProduct = async (productId) => {
  const response = await api.get(`/products/${productId}`);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);

  // 🔄 Invalidate caches
  cache.products.data = null;
  cache.lowStock.data = null;

  return response.data;
};

export const updateProduct = async (productId, productData) => {
  const response = await api.put(`/products/${productId}`, productData);

  // 🔄 Invalidate caches
  cache.products.data = null;
  cache.lowStock.data = null;

  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await api.delete(`/products/${productId}`);

  // 🔄 Invalidate caches
  cache.products.data = null;
  cache.lowStock.data = null;

  return response.data;
};

export const adjustStock = async (productId, quantityChange, reason) => {
  const response = await api.put(`/products/${productId}/stock`, {
    quantityChange,
    reason
  });

  // 🔄 Invalidate caches
  cache.products.data = null;
  cache.lowStock.data = null;

  return response.data;
};

/* --------------------------------------------------
   ALERTS & METADATA
-------------------------------------------------- */

export const getLowStockProducts = async () => {
  if (isCacheValid(cache.lowStock)) {
    return cache.lowStock.data;
  }

  try {
    const response = await api.get('/products/alerts/low-stock');
    cache.lowStock = { data: response.data || [], time: Date.now() };
    return cache.lowStock.data;
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
};

export const getProductCategories = async () => {
  if (isCacheValid(cache.categories)) {
    return cache.categories.data;
  }

  try {
    const response = await api.get('/products/categories');
    cache.categories = { data: response.data || [], time: Date.now() };
    return cache.categories.data;
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
};
