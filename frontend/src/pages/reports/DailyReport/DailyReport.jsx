import { useState } from 'react';
import { getDailyReport } from '../../../services/salesService';
import { getTodayDate } from '../../../utils/formatDate';
import { parseCedis } from '../../../utils/calculateProfit';
import Button from '../../../components/common/Button/Button';
import Loader from '../../../components/common/Loader/Loader';
import SalesChart from '../../../components/charts/SalesChart/SalesChart';
import toast from 'react-hot-toast';
import './DailyReport.css';

const DailyReport = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    setLoading(true);
    try {
      const data = await getDailyReport(selectedDate);
      setReport(data);
    } catch (error) {
      toast.error('Failed to load daily report');
      console.error('Report error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📅 Daily Sales Report</h1>
        <p className="page-subtitle">View sales performance for a specific day</p>
      </div>

      {/* Date Selector */}
      <div className="report-controls">
        <div className="date-selector">
          <label htmlFor="date">Select Date:</label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={getTodayDate()}
            className="date-input"
          />
        </div>
        <Button variant="primary" onClick={fetchReport} loading={loading}>
          Generate Report
        </Button>
      </div>

      {loading && <Loader />}

      {report && !loading && (
        <>
          {/* Summary Section */}
          <div className="report-summary">
            <div className="summary-card">
              <div className="summary-icon">🧾</div>
              <div className="summary-content">
                <h3>Transactions</h3>
                <div className="summary-value">{report.summary.totalTransactions}</div>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">📦</div>
              <div className="summary-content">
                <h3>Items Sold</h3>
                <div className="summary-value">{report.summary.totalItemsSold}</div>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">💰</div>
              <div className="summary-content">
                <h3>Revenue</h3>
                <div className="summary-value">{report.summary.totalRevenue}</div>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">💵</div>
              <div className="summary-content">
                <h3>Cost</h3>
                <div className="summary-value cost">{report.summary.totalCost}</div>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">📈</div>
              <div className="summary-content">
                <h3>Profit</h3>
                <div className="summary-value profit">{report.summary.totalProfit}</div>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <h3>Profit Margin</h3>
                <div className="summary-value">{report.summary.profitMargin}</div>
              </div>
            </div>
          </div>

          {/* Product Breakdown */}
          {report.productBreakdown && report.productBreakdown.length > 0 && (
            <div className="report-section">
              <h2 className="section-title">📦 Product Breakdown</h2>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity Sold</th>
                      <th>Revenue</th>
                      <th>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.productBreakdown.map((product, index) => (
                      <tr key={index}>
                        <td className="product-name">{product.productName}</td>
                        <td>{product.quantitySold}</td>
                        <td className="revenue">{product.revenue}</td>
                        <td className="profit">{product.profit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className={`status-banner ${report.summary.isProfitable ? 'profitable' : 'loss'}`}>
            {report.summary.isProfitable ? '✅ Profitable Day' : '⚠️ Loss Day'}
          </div>
        </>
      )}

      {!report && !loading && (
        <div className="no-report">
          <p>📊 Select a date and click "Generate Report" to view daily sales data</p>
        </div>
      )}
    </div>
  );
};

export default DailyReport;