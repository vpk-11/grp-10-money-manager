import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '../utils/format';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const ExpenseByCategoryChart = ({ expenses }) => {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No expense data available
      </div>
    );
  }

  // Group expenses by category
  const categoryData = expenses.reduce((acc, expense) => {
    const categoryName = expense.categoryId?.name || 'Uncategorized';
    const categoryColor = expense.categoryId?.color || '#6B7280';
    
    if (!acc[categoryName]) {
      acc[categoryName] = {
        name: categoryName,
        value: 0,
        color: categoryColor
      };
    }
    acc[categoryName].value += expense.amount;
    return acc;
  }, {});

  const chartData = Object.values(categoryData)
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item,
      color: item.color || COLORS[index % COLORS.length]
    }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{formatCurrency(data.value)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
        </div>
      </div>
    </div>
  );
};

export default ExpenseByCategoryChart;
