import api from './api';

/* --------------------------------------------------
   🔐 SIMPLE IN-MEMORY CACHE (ANTI-429 PROTECTION)
-------------------------------------------------- */

const cache = {
  dashboard: { data: null, time: 0 },
  topProducts: {},
  mySales: { data: null, time: 0 }
};

const CACHE_TTL = 15000; // 15 seconds

const isCacheValid = (entry) => {
  return entry.data && Date.now() - entry.time < CACHE_TTL;
};

/* --------------------------------------------------
   SALES
-------------------------------------------------- */

export const recordSale = async (saleData) => {
  const response = await api.post('/sales', saleData);

  // 🔄 Invalidate caches affected by sales
  cache.dashboard.data = null;
  cache.mySales.data = null;

  return response.data;
};

export const getAllSales = async (params = {}) => {
  try {
    const response = await api.get('/sales', { params });
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
};

export const getMySales = async () => {
  if (isCacheValid(cache.mySales)) {
    return cache.mySales.data;
  }

  try {
    const response = await api.get('/sales/my-sales');
    cache.mySales = { data: response.data || [], time: Date.now() };
    return cache.mySales.data;
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
};

/* --------------------------------------------------
   DASHBOARD & REPORTS
-------------------------------------------------- */

export const getDashboardOverview = async () => {
  if (isCacheValid(cache.dashboard)) {
    return cache.dashboard.data;
  }

  try {
    const response = await api.get('/reports/dashboard');
    cache.dashboard = {
      data: response.data,
      time: Date.now()
    };
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        today: { revenue: 'GH₵ 0.00', profit: 'GH₵ 0.00', transactions: 0, itemsSold: 0 },
        thisMonth: { revenue: 'GH₵ 0.00', profit: 'GH₵ 0.00', transactions: 0 },
        alerts: { lowStockCount: 0, criticalCount: 0 }
      };
    }
    throw error;
  }
};

export const getTopProducts = async (limit = 10) => {
  if (cache.topProducts[limit] && isCacheValid(cache.topProducts[limit])) {
    return cache.topProducts[limit].data;
  }

  try {
    const response = await api.get('/sales/top-products', {
      params: { limit }
    });

    cache.topProducts[limit] = {
      data: response.data || [],
      time: Date.now()
    };

    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
};

export const getDailySales = async (date) => {
  try {
    const response = await api.get(`/sales/daily/${date}`);
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
};

export const getMonthlySales = async (year, month) => {
  try {
    const response = await api.get(`/sales/monthly/${year}/${month}`);
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
};

export const getDailyReport = async (date) => {
  try {
    const response = await api.get(`/reports/daily/${date}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

export const getMonthlyReport = async (year, month) => {
  try {
    const response = await api.get(`/reports/monthly/${year}/${month}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

export const getProfitLossReport = async (startDate, endDate, expenses = 0) => {
  try {
    const response = await api.get('/reports/profit-loss', {
      params: { startDate, endDate, expenses }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

export const getSalesStatistics = async (startDate, endDate) => {
  try {
    const response = await api.get('/reports/stats', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

/* --------------------------------------------------
   ACTIVITY LOGS
-------------------------------------------------- */

export const getActivityLogs = async (params = {}) => {
  try {
    const response = await api.get('/activities', { params });
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
};

export const getLoginLogs = async (params = {}) => {
  try {
    const response = await api.get('/activities/logins', { params });
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
};

export const getMyActivity = async () => {
  try {
    const response = await api.get('/activities/my-activity');
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
};

export const getMyLogins = async () => {
  try {
    const response = await api.get('/activities/my-logins');
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
};
