import api from './api';

export const getAllProducts = async () => {
  const response = await api.get('/products');
  return response.data;
};

export const getProduct = async (productId) => {
  const response = await api.get(`/products/${productId}`);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProduct = async (productId, productData) => {
  const response = await api.put(`/products/${productId}`, productData);
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
};

export const adjustStock = async (productId, quantityChange, reason) => {
  const response = await api.put(`/products/${productId}/stock`, {
    quantityChange,
    reason
  });
  return response.data;
};

export const getLowStockProducts = async () => {
  const response = await api.get('/products/alerts/low-stock');
  return response.data;
};

export const getProductCategories = async () => {
  const response = await api.get('/products/categories');
  return response.data;
};