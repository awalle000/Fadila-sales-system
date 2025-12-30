import { formatCedis } from './calculateProfit.js';

// Generate daily sales report
export const generateDailyReport = (sales) => {
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
  const totalProfit = sales.reduce((sum, sale) => sum + parseFloat(sale.profit), 0);
  const totalCost = sales.reduce((sum, sale) => sum + (parseFloat(sale.costPrice) * sale.quantitySold), 0);
  const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantitySold, 0);

  // Group by product
  const productBreakdown = {};
  sales.forEach(sale => {
    const productId = sale.product.toString();
    if (!productBreakdown[productId]) {
      productBreakdown[productId] = {
        productName: sale.productName,
        quantitySold: 0,
        revenue: 0,
        profit: 0
      };
    }
    productBreakdown[productId].quantitySold += sale.quantitySold;
    productBreakdown[productId].revenue += parseFloat(sale.totalAmount);
    productBreakdown[productId].profit += parseFloat(sale.profit);
  });

  return {
    summary: {
      totalTransactions: totalSales,
      totalItemsSold,
      totalRevenue: formatCedis(totalRevenue),
      totalCost: formatCedis(totalCost),
      totalProfit: formatCedis(totalProfit),
      profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) + '%' : '0%',
      isProfitable: totalProfit > 0
    },
    productBreakdown: Object.values(productBreakdown).map(p => ({
      ...p,
      revenue: formatCedis(p.revenue),
      profit: formatCedis(p.profit)
    })),
    rawData: {
      totalRevenue,
      totalCost,
      totalProfit
    }
  };
};

// Generate monthly sales report
export const generateMonthlyReport = (sales) => {
  const dailyReport = generateDailyReport(sales);

  // Group by date
  const dailyBreakdown = {};
  sales.forEach(sale => {
    const date = new Date(sale.saleDate).toISOString().split('T')[0];
    if (!dailyBreakdown[date]) {
      dailyBreakdown[date] = {
        date,
        transactions: 0,
        revenue: 0,
        profit: 0
      };
    }
    dailyBreakdown[date].transactions += 1;
    dailyBreakdown[date].revenue += parseFloat(sale.totalAmount);
    dailyBreakdown[date].profit += parseFloat(sale.profit);
  });

  return {
    ...dailyReport,
    dailyBreakdown: Object.values(dailyBreakdown).map(d => ({
      ...d,
      revenue: formatCedis(d.revenue),
      profit: formatCedis(d.profit)
    }))
  };
};

// Generate profit/loss statement
export const generateProfitLossStatement = (sales, expenses = 0) => {
  const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
  const totalCost = sales.reduce((sum, sale) => sum + (parseFloat(sale.costPrice) * sale.quantitySold), 0);
  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - expenses;

  return {
    revenue: {
      totalSales: formatCedis(totalRevenue),
      rawValue: totalRevenue
    },
    costs: {
      costOfGoodsSold: formatCedis(totalCost),
      operatingExpenses: formatCedis(expenses),
      totalCosts: formatCedis(totalCost + expenses),
      rawValue: totalCost + expenses
    },
    profit: {
      grossProfit: formatCedis(grossProfit),
      netProfit: formatCedis(netProfit),
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) + '%' : '0%',
      isProfitable: netProfit > 0,
      status: netProfit > 0 ? 'PROFIT' : netProfit < 0 ? 'LOSS' : 'BREAK-EVEN',
      rawValue: netProfit
    }
  };
};