import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

const EngagementPieChart = ({ analyticsData }) => {
  const [engagementData, setEngagementData] = useState([]);

  useEffect(() => {
    if (analyticsData && analyticsData.length > 0) {
      // Categorize engagement by completion percentage
      const categories = {
        low: { name: 'Low (0-25%)', value: 0, color: '#ef4444' },
        moderate: { name: 'Moderate (26-50%)', value: 0, color: '#f59e0b' },
        good: { name: 'Good (51-75%)', value: 0, color: '#3b82f6' },
        excellent: { name: 'Excellent (76-100%)', value: 0, color: '#10b981' }
      };

      analyticsData.forEach(item => {
        const completion = item.avg_completion_rate || 0;
        if (completion <= 25) {
          categories.low.value++;
        } else if (completion <= 50) {
          categories.moderate.value++;
        } else if (completion <= 75) {
          categories.good.value++;
        } else {
          categories.excellent.value++;
        }
      });

      const data = Object.values(categories).filter(cat => cat.value > 0);
      setEngagementData(data);
    }
  }, [analyticsData]);

  if (!engagementData || engagementData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No engagement data available</p>
      </div>
    );
  }

  const COLORS = engagementData.map(item => item.color);

  // Custom label
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percent < 0.05) return null; // Don't show label if too small

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={14}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{data.name}</p>
          <p className="text-sm">Videos: <span className="font-semibold">{data.value}</span></p>
          <p className="text-sm">
            Percentage: <span className="font-semibold">{((data.value / engagementData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const totalVideos = engagementData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Total Videos Analyzed: <span className="font-semibold text-gray-800">{totalVideos}</span>
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={engagementData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {engagementData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value, entry) => {
              const percentage = ((entry.payload.value / totalVideos) * 100).toFixed(1);
              return `${value} (${entry.payload.value} - ${percentage}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {engagementData.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: item.color }}
            ></div>
            <div className="flex-1">
              <p className="text-xs text-gray-600">{item.name}</p>
              <p className="text-lg font-semibold">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EngagementPieChart;
