import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getDashboardOverview, getMySales } from '../../../services/salesService';
import { getLowStockProducts } from '../../../services/productService';
import LowStockAlert from '../../../components/alerts/LowStockAlert/LowStockAlert';
import Loader from '../../../components/common/Loader/Loader';
import { formatDate } from '../../../utils/formatDate';
import toast from 'react-hot-toast';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [mySales, setMySales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔐 Prevent duplicate API calls (React StrictMode / HMR safe)
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const [overview, sales, lowStock] = await Promise.all([
        getDashboardOverview(),
        getMySales(),
        getLowStockProducts()
      ]);

      setDashboardData(overview || {});
      setMySales((sales || []).slice(0, 5)); // last 5 sales only
      setLowStockProducts(lowStock || []);
    } catch (error) {
      if (error?.response?.status !== 404) {
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
        <h1 className="page-title">👋 Welcome, {user?.name}!</h1>
        <p className="page-subtitle">
          Manager Dashboard - Track your sales performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card today">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Today's Sales</h3>
            <div className="stat-value">
              {dashboardData?.today?.revenue || 'GH₵ 0.00'}
            </div>
            <div className="stat-meta">
              <span>{dashboardData?.today?.transactions || 0} transactions</span>
              <span>{dashboardData?.today?.itemsSold || 0} items sold</span>
            </div>
          </div>
        </div>

        <div className="stat-card profit">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Today's Revenue</h3>
            <div className="stat-value">
              {dashboardData?.today?.revenue || 'GH₵ 0.00'}
            </div>
            <div className="stat-meta">
              <span>Total revenue for today</span>
            </div>
          </div>
        </div>

        <div className="stat-card month">
          <div className="stat-icon">📆</div>
          <div className="stat-content">
            <h3>This Month</h3>
            <div className="stat-value">
              {dashboardData?.thisMonth?.revenue || 'GH₵ 0.00'}
            </div>
            <div className="stat-meta">
              <span>
                {dashboardData?.thisMonth?.transactions || 0} transactions
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card alerts">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Stock Alerts</h3>
            <div className="stat-value">
              {dashboardData?.alerts?.lowStockCount || 0}
            </div>
            <div className="stat-meta">
              <span>
                {dashboardData?.alerts?.criticalCount || 0} critical alerts
              </span>
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

      {/* Recent Sales */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>📝 My Recent Sales</h2>
          <button
            className="btn-view-all"
            onClick={() => navigate('/sales/history')}
          >
            View All
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {mySales.length > 0 ? (
                mySales.map((sale) => (
                  <tr key={sale._id}>
                    <td>{formatDate(sale.saleDate)}</td>
                    <td className="product-name">{sale.productName}</td>
                    <td>{sale.quantitySold}</td>
                    <td className="revenue">
                      GH₵ {sale.totalAmount?.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">
                    📝 No sales recorded yet.
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
          💰 New Sale
        </button>
        <button className="action-card" onClick={() => navigate('/products')}>
          📦 View Products
        </button>
        <button className="action-card" onClick={() => navigate('/inventory')}>
          📋 Stock Overview
        </button>
        <button
          className="action-card"
          onClick={() => navigate('/reports/daily')}
        >
          📊 Daily Report
        </button>
      </div>
    </div>
  );
};

export default ManagerDashboard;
