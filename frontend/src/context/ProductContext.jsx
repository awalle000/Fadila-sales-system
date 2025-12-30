import { createContext, useContext, useState, useCallback } from 'react';
import { getAllProducts, getLowStockProducts } from '../services/productService';
import toast from 'react-hot-toast';

const ProductContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within ProductProvider');
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProducts();
      setProducts(data);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch products';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLowStockProducts = useCallback(async () => {
    try {
      const data = await getLowStockProducts();
      setLowStockProducts(data);
      return data;
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }
  }, []);

  const refreshProducts = async () => {
    await fetchProducts();
    await fetchLowStockProducts();
  };

  const value = {
    products,
    lowStockProducts,
    loading,
    fetchProducts,
    fetchLowStockProducts,
    refreshProducts
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};