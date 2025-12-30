import { useState } from 'react';
import { getProfitLossReport } from '../../../services/salesService';
import { getTodayDate } from '../../../utils/formatDate';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import Loader from '../../../components/common/Loader/Loader';
import toast from 'react-hot-toast';
import './ProfitLoss.css';

const ProfitLoss = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(getTodayDate());
  const [expenses, setExpenses] = useState('0');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    setLoading(true);
    try {
      const data = await getProfitLossReport(startDate, endDate, parseFloat(expenses));
      setReport(data);
    } catch (error) {
      toast.error('Failed to load profit/loss report');
      console.error('Report error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">💹 Profit & Loss Statement</h1>
        <p className="page-subtitle">CEO-only financial performance report</p>
      </div>

      {/* Report Controls */}
      <div className="report-controls-grid">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          max={endDate || getTodayDate()}
        />

        <Input
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          max={getTodayDate()}
        />

        <Input
          label="Operating Expenses (GH₵)"
          type="number"
          value={expenses}
          onChange={(e) => setExpenses(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
        />

        <div className="button-wrapper">
          <Button variant="primary" onClick={fetchReport} loading={loading} fullWidth>
            Generate Statement
          </Button>
        </div>
      </div>

      {loading && <Loader />}

      {report && !loading && (
        <div className="profit-loss-statement">
          {/* Revenue Section */}
          <div className="statement-section revenue-section">
            <h2>💰 Revenue</h2>
            <div className="statement-row">
              <span>Total Sales</span>
              <span className="amount">{report.revenue.totalSales}</span>
            </div>
            <div className="statement-row total">
              <span>Total Revenue</span>
              <span className="amount">{report.revenue.totalSales}</span>
            </div>
          </div>

          {/* Costs Section */}
          <div className="statement-section costs-section">
            <h2>💵 Costs & Expenses</h2>
            <div className="statement-row">
              <span>Cost of Goods Sold</span>
              <span className="amount">{report.costs.costOfGoodsSold}</span>
            </div>
            <div className="statement-row">
              <span>Operating Expenses</span>
              <span className="amount">{report.costs.operatingExpenses}</span>
            </div>
            <div className="statement-row total">
              <span>Total Costs</span>
              <span className="amount">{report.costs.totalCosts}</span>
            </div>
          </div>

          {/* Profit Section */}
          <div className="statement-section profit-section">
            <h2>📈 Profit Analysis</h2>
            <div className="statement-row">
              <span>Gross Profit</span>
              <span className="amount">{report.profit.grossProfit}</span>
            </div>
            <div className="statement-row">
              <span>Profit Margin</span>
              <span className="amount">{report.profit.profitMargin}</span>
            </div>
            <div className={`statement-row net-profit ${report.profit.isProfitable ? 'profitable' : 'loss'}`}>
              <span>Net Profit</span>
              <span className="amount">{report.profit.netProfit}</span>
            </div>
          </div>

          {/* Status Banner */}
          <div className={`status-banner ${report.profit.status.toLowerCase()}`}>
            {report.profit.status === 'PROFIT' && '✅ PROFIT'}
            {report.profit.status === 'LOSS' && '⚠️ LOSS'}
            {report.profit.status === 'BREAK-EVEN' && '➖ BREAK-EVEN'}
          </div>
        </div>
      )}

      {!report && !loading && (
        <div className="no-report">
          <p>💹 Select date range and enter expenses to generate profit/loss statement</p>
        </div>
      )}
    </div>
  );
};

export default ProfitLoss;