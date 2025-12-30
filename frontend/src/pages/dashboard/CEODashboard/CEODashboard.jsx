import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardOverview, getTopProducts } from '../../../services/salesService';
import { getLowStockProducts } from '../../../services/productService';
import LowStockAlert from '../../../components/alerts/LowStockAlert/LowStockAlert';
import SalesChart from '../../../components/charts/SalesChart/SalesChart';
import ProfitChart from '../../../components/charts/ProfitChart/ProfitChart';
import Loader from '../../../components/common/Loader/Loader';
import toast from 'react-hot-toast';
import './CEODashboard.css';

const CEODashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(false);
    try {
      const [overview, products, lowStock] = await Promise.all([
        getDashboardOverview(),
        getTopProducts(5),
        getLowStockProducts()
      ]);

      setDashboardData(overview);
      setTopProducts(products);
      setLowStockProducts(lowStock);
    } catch (error) {
      // Only show error for actual server errors, not empty data
      if (error.response && error.response.status !== 404) {
        toast.error('Failed to load dashboard data');
        console.error('Dashboard error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📊 CEO Dashboard</h1>
        <p className="page-subtitle">Complete overview of your business performance</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card today">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Today's Sales</h3>
            <div className="stat-value">{dashboardData?.today?.revenue || 'GH₵ 0.00'}</div>
            <div className="stat-meta">
              <span>{dashboardData?.today?.transactions || 0} transactions</span>
              <span>{dashboardData?.today?.itemsSold || 0} items sold</span>
            </div>
          </div>
        </div>

        <div className="stat-card profit">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Today's Profit</h3>
            <div className="stat-value">{dashboardData?.today?.profit || 'GH₵ 0.00'}</div>
            <div className="stat-meta">
              <span>Net profit for today</span>
            </div>
          </div>
        </div>

        <div className="stat-card month">
          <div className="stat-icon">📆</div>
          <div className="stat-content">
            <h3>This Month</h3>
            <div className="stat-value">{dashboardData?.thisMonth?.revenue || 'GH₵ 0.00'}</div>
            <div className="stat-meta">
              <span>{dashboardData?.thisMonth?.transactions || 0} transactions</span>
              <span>Profit: {dashboardData?.thisMonth?.profit || 'GH₵ 0.00'}</span>
            </div>
          </div>
        </div>

        <div className="stat-card alerts">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Stock Alerts</h3>
            <div className="stat-value">{dashboardData?.alerts?.lowStockCount || 0}</div>
            <div className="stat-meta">
              <span>{dashboardData?.alerts?.criticalCount || 0} critical alerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="dashboard-section">
          <LowStockAlert
            products={lowStockProducts}
            onViewAll={() => navigate('/inventory')}
          />
        </div>
      )}

      {/* Charts */}
      {topProducts.length > 0 && (
        <div className="charts-grid">
          <ProfitChart data={topProducts} title="Top 5 Products by Profit" />
        </div>
      )}

      {/* Top Products Table */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>🏆 Top Selling Products</h2>
          <button className="btn-view-all" onClick={() => navigate('/sales/history')}>
            View All Sales
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <tr key={product._id}>
                    <td>
                      <span className="rank-badge">{index + 1}</span>
                    </td>
                    <td className="product-name">{product.productName}</td>
                    <td>{product.totalSold}</td>
                    <td className="revenue">GH₵ {product.totalRevenue?.toFixed(2) || '0.00'}</td>
                    <td className="profit">GH₵ {product.totalProfit?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">
                    📊 No sales data yet. Start by adding products and making your first sale!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-card" onClick={() => navigate('/sales/new')}>
          <div className="action-icon">💰</div>
          <div className="action-text">New Sale</div>
        </button>
        <button className="action-card" onClick={() => navigate('/products/add')}>
          <div className="action-icon">📦</div>
          <div className="action-text">Add Product</div>
        </button>
        <button className="action-card" onClick={() => navigate('/reports/profit-loss')}>
          <div className="action-icon">💹</div>
          <div className="action-text">Profit/Loss</div>
        </button>
        <button className="action-card" onClick={() => navigate('/activity-logs')}>
          <div className="action-icon">🔍</div>
          <div className="action-text">Activity Logs</div>
        </button>
      </div>
    </div>
  );
};

export default CEODashboard;