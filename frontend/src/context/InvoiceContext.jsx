import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

// Invoice structure (frontend/local):
// {
//   id,
//   receiptNumber,
//   items: [{ productId, productName, quantity, unitPrice, discount, finalAmount, unit }],
//   totals: { totalAmount, totalDiscount, finalAmount, totalProfit, totalItems },
//   saleDate,
//   soldBy,
//   customerName,
//   paymentType: 'cash'|'credit',
//   status: 'pending'|'paid',
//   remainingBalance,
//   payments: [{ id, amount, date, note }],
//   dueDate: null,
//   notes: ''
// }

const InvoiceContext = createContext();

export const useInvoices = () => useContext(InvoiceContext);

export const InvoiceProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('invoices_v1');
      if (raw) {
        setInvoices(JSON.parse(raw));
      }
    } catch (err) {
      console.error('Failed to load invoices from storage', err);
    }
  }, []);

  // Persist to localStorage whenever invoices change
  useEffect(() => {
    try {
      localStorage.setItem('invoices_v1', JSON.stringify(invoices));
    } catch (err) {
      console.error('Failed to save invoices to storage', err);
    }
  }, [invoices]);

  const createInvoice = (payload) => {
    const id = uuidv4();
    const invoice = {
      id,
      receiptNumber: payload.receiptNumber || `INV-${Date.now()}`,
      items: payload.items || [],
      totals: payload.totals || { totalAmount: 0, totalDiscount: 0, finalAmount: 0, totalProfit: 0, totalItems: 0 },
      saleDate: payload.saleDate || new Date().toISOString(),
      soldBy: payload.soldBy || 'Unknown',
      customerName: payload.customerName || 'Walk-in',
      paymentType: payload.paymentType || 'credit',
      status: payload.totals && payload.totals.finalAmount === 0 ? 'paid' : (payload.paymentType === 'cash' ? 'paid' : 'pending'),
      remainingBalance: payload.totals ? payload.totals.finalAmount : 0,
      payments: payload.payments || [],
      dueDate: payload.dueDate || null,
      notes: payload.notes || ''
    };

    setInvoices(prev => [invoice, ...prev]);
    toast.success('Invoice created');
    return invoice;
  };

  const updateInvoice = (id, updates) => {
    let found = false;
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        found = true;
        return { ...inv, ...updates };
      }
      return inv;
    }));
    if (!found) {
      toast.error('Invoice not found');
    }
  };

  const recordPayment = (id, amount, note) => {
    if (!amount || amount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    setInvoices(prev => prev.map(inv => {
      if (inv.id !== id) return inv;

      const payment = { id: uuidv4(), amount: parseFloat(amount), date: new Date().toISOString(), note: note || '' };
      const payments = [...inv.payments, payment];
      const remainingBalance = Math.max(0, parseFloat(inv.remainingBalance) - payment.amount);
      const status = remainingBalance === 0 ? 'paid' : 'pending';
      return { ...inv, payments, remainingBalance, status };
    }));

    toast.success('Payment recorded');
  };

  const deleteInvoice = (id) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    toast.success('Invoice deleted');
  };

  const getInvoiceById = (id) => invoices.find(inv => inv.id === id);

  const value = {
    invoices,
    createInvoice,
    updateInvoice,
    recordPayment,
    deleteInvoice,
    getInvoiceById,
    setInvoices
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
};