import api from './api';

/* --------------------------------------------------
   🔐 SIMPLE IN-MEMORY CACHE
-------------------------------------------------- */

const cache = {
  invoices: { data: null, time: 0 }
};

const CACHE_TTL = 15000; // 15 seconds

const isCacheValid = (entry) =>
  entry.data && Date.now() - entry.time < CACHE_TTL;

/* --------------------------------------------------
   INVOICES
-------------------------------------------------- */

export const createInvoice = async (payload) => {
  const res = await api.post('/invoices', payload);

  // 🔄 Invalidate cache
  cache.invoices.data = null;

  return res.data;
};

export const getInvoices = async (params = {}) => {
  if (isCacheValid(cache.invoices)) {
    return cache.invoices.data;
  }

  const res = await api.get('/invoices', { params });
  cache.invoices = { data: res.data || [], time: Date.now() };
  return cache.invoices.data;
};

export const getInvoiceById = async (id) => {
  const res = await api.get(`/invoices/${id}`);
  return res.data;
};

export const recordInvoicePayment = async (id, amount, note = '') => {
  const res = await api.post(`/invoices/${id}/payments`, { amount, note });

  // 🔄 Invalidate cache
  cache.invoices.data = null;

  return res.data;
};

export const updateInvoice = async (id, updates) => {
  const res = await api.put(`/invoices/${id}`, updates);

  // 🔄 Invalidate cache
  cache.invoices.data = null;

  return res.data;
};

export const deleteInvoice = async (id) => {
  const res = await api.delete(`/invoices/${id}`);

  // 🔄 Invalidate cache
  cache.invoices.data = null;

  return res.data;
};
