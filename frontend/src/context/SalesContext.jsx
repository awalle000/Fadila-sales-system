import { createContext, useContext, useState, useCallback } from 'react';
import { getAllSales, getDashboardOverview } from '../services/salesService';
import toast from 'react-hot-toast';

const SalesContext = createContext();

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within SalesProvider');
  }
  return context;
};

export const SalesProvider = ({ children }) => {
  const [sales, setSales] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSales = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const data = await getAllSales(params);
      setSales(data);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch sales';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const data = await getDashboardOverview();
      setDashboardData(data);
      return data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }, []);

  const refreshSales = async () => {
    await fetchSales();
    await fetchDashboardData();
  };

  const value = {
    sales,
    dashboardData,
    loading,
    fetchSales,
    fetchDashboardData,
    refreshSales
  };

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
};