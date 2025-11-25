import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../utils/format';
import { TrendingUp, TrendingDown } from 'lucide-react';

const SpendingTrendChart = ({ expenses, period = 'daily' }) => {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No spending data available
      </div>
    );
  }

  // Group expenses by period
  const groupedData = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date);
    let key;
    
    if (period === 'daily') {
      key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (period === 'weekly') {
      const weekNum = Math.ceil(date.getDate() / 7);
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${weekNum}`;
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!acc[key]) {
      acc[key] = { date: key, amount: 0, count: 0 };
    }
    acc[key].amount += expense.amount;
    acc[key].count += 1;
    
    return acc;
  }, {});

  const chartData = Object.values(groupedData)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30) // Last 30 periods
    .map(item => ({
      ...item,
      average: item.amount / item.count,
      dateLabel: formatDateLabel(item.date, period)
    }));

  // Calculate trend
  const recentAvg = chartData.slice(-7).reduce((sum, item) => sum + item.amount, 0) / 7;
  const previousAvg = chartData.slice(-14, -7).reduce((sum, item) => sum + item.amount, 0) / 7;
  const trend = recentAvg - previousAvg;
  const trendPercentage = previousAvg > 0 ? ((trend / previousAvg) * 100).toFixed(1) : 0;

  function formatDateLabel(dateStr, period) {
    if (period === 'daily') {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (period === 'weekly') {
      return dateStr.split('-')[2]; // Just show week number
    } else {
      const [year, month] = dateStr.split('-');
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-1">{label}</p>
          <p className="text-sm text-gray-600">
            Total: {formatCurrency(data.amount)}
          </p>
          <p className="text-sm text-gray-600">
            Transactions: {data.count}
          </p>
          <p className="text-sm text-gray-600">
            Average: {formatCurrency(data.average)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full space-y-4">
      {/* Trend indicator */}
      <div className={`flex items-center justify-between p-4 rounded-lg ${
        trend >= 0 ? 'bg-red-50' : 'bg-green-50'
      }`}>
        <div className="flex items-center space-x-2">
          {trend >= 0 ? (
            <TrendingUp className="h-5 w-5 text-red-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-green-600" />
          )}
          <span className="text-sm font-medium text-gray-900">
            Spending Trend (Last 7 days)
          </span>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${trend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {trend >= 0 ? '+' : ''}{trendPercentage}%
          </p>
          <p className="text-xs text-gray-600">
            {formatCurrency(Math.abs(trend))}/day vs previous week
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="dateLabel" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis tickFormatter={(value) => `$${value}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="#EF4444" 
            strokeWidth={2}
            name="Daily Spending"
            dot={{ fill: '#EF4444', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpendingTrendChart;
