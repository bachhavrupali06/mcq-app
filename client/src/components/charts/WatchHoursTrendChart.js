import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';

const WatchHoursTrendChart = ({ data, period }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No data available for the selected period</p>
      </div>
    );
  }

  // Format period label based on period type
  const formatPeriodLabel = (value) => {
    if (period === 'day') {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (period === 'week') {
      return value; // Format: 2025-W40
    } else if (period === 'month') {
      const [year, month] = value.split('-');
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else if (period === 'year') {
      return value;
    }
    return value;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{formatPeriodLabel(label)}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          
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
            yAxisId="left"
            stroke="#3b82f6"
            fontSize={12}
            label={{ value: 'Hours Watched', angle: -90, position: 'insideLeft', style: { fill: '#3b82f6' } }}
          />
          
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#10b981"
            fontSize={12}
            label={{ value: 'Sessions', angle: 90, position: 'insideRight', style: { fill: '#10b981' } }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="total_hours"
            fill="url(#colorHours)"
            stroke="#3b82f6"
            strokeWidth={0}
            name="Hours Watched"
          />
          
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="total_hours"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="Hours Watched"
          />
          
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="total_sessions"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="Sessions"
            strokeDasharray="5 5"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WatchHoursTrendChart;
