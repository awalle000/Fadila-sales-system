import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { parseCedis } from '../../../utils/calculateProfit';
import './ProfitChart.css';

const ProfitChart = ({ data, title = 'Profit Analysis' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-empty">
          <p>💹 No profit data available</p>
        </div>
      </div>
    );
  }

  // Transform data for chart
  const chartData = data.map(item => ({
    name: item.productName || item.name || 'N/A',
    profit: parseCedis(item.profit || item.totalProfit),
    revenue: parseCedis(item.revenue || item.totalRevenue)
  }));

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
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
              return [`GH₵ ${value.toFixed(2)}`, name === 'profit' ? 'Profit' : 'Revenue'];
            }}
          />
          <Legend />
          <Bar dataKey="revenue" fill="#667eea" radius={[8, 8, 0, 0]} />
          <Bar dataKey="profit" fill="#38ef7d" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProfitChart;