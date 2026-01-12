import api from './api';

// invoiceService now re-uses the shared axios `api` instance which already
// adds the Authorization header from sessionStorage ('token') and the baseURL.

export const createInvoice = async (payload) => {
  const res = await api.post('/invoices', payload);
  return res.data;
};

export const getInvoices = async (params = {}) => {
  const res = await api.get('/invoices', { params });
  return res.data || [];
};

export const getInvoiceById = async (id) => {
  const res = await api.get(`/invoices/${id}`);
  return res.data;
};

export const recordInvoicePayment = async (id, amount, note = '') => {
  const res = await api.post(`/invoices/${id}/payments`, { amount, note });
  return res.data;
};

export const updateInvoice = async (id, updates) => {
  const res = await api.put(`/invoices/${id}`, updates);
  return res.data;
};

export const deleteInvoice = async (id) => {
  const res = await api.delete(`/invoices/${id}`);
  return res.data;
};