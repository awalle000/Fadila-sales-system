// Calculate profit for a single sale
export const calculateProfit = (costPrice, sellingPrice, quantity) => {
  const profit = (sellingPrice - costPrice) * quantity;
  return parseFloat(profit.toFixed(2));
};

// Calculate total cost
export const calculateTotalCost = (costPrice, quantity) => {
  return parseFloat((costPrice * quantity).toFixed(2));
};

// Calculate total revenue
export const calculateTotalRevenue = (sellingPrice, quantity) => {
  return parseFloat((sellingPrice * quantity).toFixed(2));
};

// Calculate profit margin percentage
export const calculateProfitMargin = (costPrice, sellingPrice) => {
  if (costPrice === 0) return 0;
  const margin = ((sellingPrice - costPrice) / costPrice) * 100;
  return parseFloat(margin.toFixed(2));
};

// Format amount in Ghana Cedis
export const formatCedis = (amount) => {
  return `GH₵ ${parseFloat(amount).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Determine if profit or loss
export const isProfitable = (costPrice, sellingPrice) => {
  return sellingPrice > costPrice;
};