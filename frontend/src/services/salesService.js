import api from './api';

export const recordSale = async (saleData) => {
  const response = await api.post('/sales', saleData);
  return response.data;
};

export const getAllSales = async (params = {}) => {
  const response = await api.get('/sales', { params });
  return response.data;
};

export const getMySales = async () => {
  const response = await api.get('/sales/my-sales');
  return response.data;
};

export const getDailySales = async (date) => {
  const response = await api.get(`/sales/daily/${date}`);
  return response.data;
};

export const getMonthlySales = async (year, month) => {
  const response = await api.get(`/sales/monthly/${year}/${month}`);
  return response.data;
};

export const getTopProducts = async (limit = 10) => {
  const response = await api.get('/sales/top-products', {
    params: { limit }
  });
  return response.data;
};

export const getDailyReport = async (date) => {
  const response = await api.get(`/reports/daily/${date}`);
  return response.data;
};

export const getMonthlyReport = async (year, month) => {
  const response = await api.get(`/reports/monthly/${year}/${month}`);
  return response.data;
};

export const getProfitLossReport = async (startDate, endDate, expenses = 0) => {
  const response = await api.get('/reports/profit-loss', {
    params: { startDate, endDate, expenses }
  });
  return response.data;
};

export const getSalesStatistics = async (startDate, endDate) => {
  const response = await api.get('/reports/stats', {
    params: { startDate, endDate }
  });
  return response.data;
};

export const getInventoryAlerts = async () => {
  const response = await api.get('/reports/inventory-alerts');
  return response.data;
};

export const getDashboardOverview = async () => {
  const response = await api.get('/reports/dashboard');
  return response.data;
};

export const getActivityLogs = async (params = {}) => {
  const response = await api.get('/activities', { params });
  return response.data;
};

export const getLoginLogs = async (params = {}) => {
  const response = await api.get('/activities/logins', { params });
  return response.data;
};

export const getMyActivity = async () => {
  const response = await api.get('/activities/my-activity');
  return response.data;
};

export const getMyLogins = async () => {
  const response = await api.get('/activities/my-logins');
  return response.data;
};