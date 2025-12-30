export const calculateProfit = (costPrice, sellingPrice, quantity) => {
  const profit = (sellingPrice - costPrice) * quantity;
  return parseFloat(profit.toFixed(2));
};

export const calculateTotalCost = (costPrice, quantity) => {
  return parseFloat((costPrice * quantity).toFixed(2));
};

export const calculateTotalRevenue = (sellingPrice, quantity) => {
  return parseFloat((sellingPrice * quantity).toFixed(2));
};

export const calculateProfitMargin = (costPrice, sellingPrice) => {
  if (costPrice === 0) return 0;
  const margin = ((sellingPrice - costPrice) / costPrice) * 100;
  return parseFloat(margin.toFixed(2));
};

export const formatCedis = (amount) => {
  if (typeof amount === 'string' && amount.includes('GH₵')) {
    return amount;
  }
  return `GH₵ ${parseFloat(amount || 0).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const parseCedis = (cedisString) => {
  if (typeof cedisString === 'number') return cedisString;
  return parseFloat(cedisString.replace(/[^0-9.-]+/g, '')) || 0;
};

export const isProfitable = (costPrice, sellingPrice) => {
  return sellingPrice > costPrice;
};