import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { parseCedis } from '../../../utils/calculateProfit';
import './SalesChart.css';

const SalesChart = ({ data, title = 'Sales Overview' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-empty">
          <p>📊 No sales data available</p>
        </div>
      </div>
    );
  }

  // Transform data for chart
  const chartData = data.map(item => ({
    name: item.date || item.name || 'N/A',
    revenue: parseCedis(item.revenue),
    transactions: item.transactions || 0
  }));

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="name" 
            stroke="#666"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#666"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '10px'
            }}
            formatter={(value, name) => {
              if (name === 'revenue') {
                return [`GH₵ ${value.toFixed(2)}`, 'Revenue'];
              }
              return [value, 'Transactions'];
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#667eea" 
            strokeWidth={3}
            dot={{ fill: '#667eea', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="transactions" 
            stroke="#38ef7d" 
            strokeWidth={3}
            dot={{ fill: '#38ef7d', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;