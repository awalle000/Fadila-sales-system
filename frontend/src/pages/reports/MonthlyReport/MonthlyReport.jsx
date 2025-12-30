import { useState } from 'react';
import { getMonthlyReport } from '../../../services/salesService';
import { getCurrentYear, getCurrentMonth } from '../../../utils/formatDate';
import SalesChart from '../../../components/charts/SalesChart/SalesChart';
import ProfitChart from '../../../components/charts/ProfitChart/ProfitChart';
import Button from '../../../components/common/Button/Button';
import Loader from '../../../components/common/Loader/Loader';
import toast from 'react-hot-toast';
import './MonthlyReport.css';

const MonthlyReport = () => {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await getMonthlyReport(selectedYear, selectedMonth);
      setReport(data);
    } catch (error) {
      toast.error('Failed to load monthly report');
      console.error('Report error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📆 Monthly Sales Report</h1>
        <p className="page-subtitle">View monthly sales performance and trends</p>
      </div>

      {/* Month Selector */}
      <div className="report-controls">
        <div className="month-selector">
          <label htmlFor="year">Year:</label>
          <select
            id="year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="select-input"
          >
            {[...Array(5)].map((_, i) => {
              const year = getCurrentYear() - i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>

        <div className="month-selector">
          <label htmlFor="month">Month:</label>
          <select
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="select-input"
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
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

          {/* Daily Breakdown Chart */}
          {report.dailyBreakdown && report.dailyBreakdown.length > 0 && (
            <div className="report-section">
              <SalesChart data={report.dailyBreakdown} title="Daily Sales Trend" />
            </div>
          )}

          {/* Product Breakdown */}
          {report.productBreakdown && report.productBreakdown.length > 0 && (
            <>
              <div className="report-section">
                <ProfitChart data={report.productBreakdown} title="Product Performance" />
              </div>

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
            </>
          )}

          {/* Status Badge */}
          <div className={`status-banner ${report.summary.isProfitable ? 'profitable' : 'loss'}`}>
            {report.summary.isProfitable ? '✅ Profitable Month' : '⚠️ Loss Month'}
          </div>
        </>
      )}

      {!report && !loading && (
        <div className="no-report">
          <p>📊 Select a month and click "Generate Report" to view monthly sales data</p>
        </div>
      )}
    </div>
  );
};

export default MonthlyReport;