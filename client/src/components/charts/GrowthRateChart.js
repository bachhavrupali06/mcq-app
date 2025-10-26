import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';

const GrowthRateChart = ({ data, period }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No data available for growth analysis</p>
      </div>
    );
  }

  // Calculate growth rate for each period
  const dataWithGrowth = data.map((item, index) => {
    if (index === 0) {
      return { ...item, growth: 0 };
    }
    const previous = parseFloat(data[index - 1].total_hours || 0);
    const current = parseFloat(item.total_hours || 0);
    const growth = previous > 0 ? ((current - previous) / previous * 100) : 0;
    return { ...item, growth: parseFloat(growth.toFixed(2)) };
  });

  // Format period label based on period type
  const formatPeriodLabel = (value) => {
    if (period === 'day') {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (period === 'week') {
      return value;
    } else if (period === 'month') {
      const [year, month] = value.split('-');
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else if (period === 'year') {
      return value;
    }
    return value;
  };

  // Get color based on growth value
  const getBarColor = (value) => {
    if (value > 0) return '#10b981'; // Green for growth
    if (value < 0) return '#ef4444'; // Red for decline
    return '#6b7280'; // Gray for no change
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const growth = payload[0].value;
      const isPositive = growth > 0;
      const isNegative = growth < 0;
      
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{formatPeriodLabel(label)}</p>
          <p className="text-sm">
            Growth: 
            <span 
              className={`font-semibold ml-1 ${
                isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
              }`}
            >
              {isPositive ? '+' : ''}{growth}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate average growth
  const avgGrowth = dataWithGrowth.length > 0
    ? dataWithGrowth.reduce((sum, item) => sum + item.growth, 0) / dataWithGrowth.length
    : 0;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-gray-600">Avg Growth: </span>
          <span className={`font-semibold ${avgGrowth > 0 ? 'text-green-600' : avgGrowth < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {avgGrowth > 0 ? '+' : ''}{avgGrowth.toFixed(2)}%
          </span>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Growth</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Decline</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={dataWithGrowth}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          
          <XAxis
            dataKey="period"
            tickFormatter={formatPeriodLabel}
            stroke="#666"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          
          <YAxis
            stroke="#666"
            fontSize={12}
            label={{ value: 'Growth (%)', angle: -90, position: 'insideLeft' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <ReferenceLine y={0} stroke="#666" strokeWidth={2} />
          
          <ReferenceLine
            y={avgGrowth}
            stroke="#9333ea"
            strokeDasharray="5 5"
            label={{
              value: `Avg: ${avgGrowth.toFixed(1)}%`,
              position: 'right',
              fill: '#9333ea',
              fontSize: 12
            }}
          />
          
          <Bar
            dataKey="growth"
            name="Growth Rate"
            radius={[8, 8, 0, 0]}
          >
            {dataWithGrowth.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.growth)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GrowthRateChart;
