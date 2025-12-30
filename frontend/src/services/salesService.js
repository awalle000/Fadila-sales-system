import api from './api';

export const recordSale = async (saleData) => {
  const response = await api.post('/sales', saleData);
  return response.data;
};

export const getAllSales = async (params = {}) => {
  try {
    const response = await api.get('/sales', { params });
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const getMySales = async () => {
  try {
    const response = await api.get('/sales/my-sales');
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const getDailySales = async (date) => {
  try {
    const response = await api.get(`/sales/daily/${date}`);
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const getMonthlySales = async (year, month) => {
  try {
    const response = await api.get(`/sales/monthly/${year}/${month}`);
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const getTopProducts = async (limit = 10) => {
  try {
    const response = await api.get('/sales/top-products', {
      params: { limit }
    });
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const getDailyReport = async (date) => {
  try {
    const response = await api.get(`/reports/daily/${date}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const getMonthlyReport = async (year, month) => {
  try {
    const response = await api.get(`/reports/monthly/${year}/${month}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
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
    if (error.response?.status === 404) {
      return null;
    }
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
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const getInventoryAlerts = async () => {
  try {
    const response = await api.get('/reports/inventory-alerts');
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const getDashboardOverview = async () => {
  try {
    const response = await api.get('/reports/dashboard');
    return response.data || {
      today: { revenue: 'GH₵ 0.00', profit: 'GH₵ 0.00', transactions: 0, itemsSold: 0 },
      thisMonth: { revenue: 'GH₵ 0.00', profit: 'GH₵ 0.00', transactions: 0 },
      alerts: { lowStockCount: 0, criticalCount: 0 }
    };
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

export const getActivityLogs = async (params = {}) => {
  try {
    const response = await api.get('/activities', { params });
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const getLoginLogs = async (params = {}) => {
  try {
    const response = await api.get('/activities/logins', { params });
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const getMyActivity = async () => {
  try {
    const response = await api.get('/activities/my-activity');
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const getMyLogins = async () => {
  try {
    const response = await api.get('/activities/my-logins');
    return response.data || [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};