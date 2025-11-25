import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/format';

const IncomeVsExpenseChart = ({ incomes, expenses, period = 'monthly' }) => {
  if ((!incomes || incomes.length === 0) && (!expenses || expenses.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  // Group by month or week
  const groupData = (transactions, type) => {
    return transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const key = period === 'monthly' 
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : `Week ${Math.ceil(date.getDate() / 7)}`;
      
      if (!acc[key]) {
        acc[key] = { date: key, income: 0, expenses: 0 };
      }
      
      if (type === 'income') {
        acc[key].income += transaction.amount;
      } else {
        acc[key].expenses += transaction.amount;
      }
      
      return acc;
    }, {});
  };

  const incomeData = groupData(incomes || [], 'income');
  const expenseData = groupData(expenses || [], 'expense');

  // Merge the data
  const allKeys = new Set([...Object.keys(incomeData), ...Object.keys(expenseData)]);
  const chartData = Array.from(allKeys).map(key => ({
    date: key,
    income: incomeData[key]?.income || 0,
    expenses: expenseData[key]?.expenses || 0,
    net: (incomeData[key]?.income || 0) - (expenseData[key]?.expenses || 0)
  })).sort((a, b) => a.date.localeCompare(b.date)).slice(-6);

  // Format date labels
  chartData.forEach(item => {
    if (period === 'monthly') {
      const [year, month] = item.date.split('-');
      // Added check for valid year/month data
      if (year && month) {
        const date = new Date(year, parseInt(month) - 1);
        item.dateLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else {
        item.dateLabel = item.date;
      }
    } else {
      item.dateLabel = item.date;
    }
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <p className="font-semibold text-gray-900 mb-2 dark:text-gray-100">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          <p className="text-sm font-semibold text-gray-700 mt-1 pt-1 border-t dark:text-gray-300 dark:border-gray-700">
            Net: {formatCurrency(payload[0].payload.net)}
          </p>
        </div>
      );
    }
    return null;
  };

  /**
   * FIX: Corrected tick formatter to handle values under 1000.
   * - If value >= 1000, format as $Xk (e.g., 5000 -> $5k)
   * - If value < 1000, format as $X (e.g., 500 -> $500)
   */
  const formatYAxisTick = (value) => {
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    // Return the value directly without 'k' if it's less than 1000
    return `$${value.toFixed(0)}`;
  };
  // -------------------------

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dateLabel" />
          {/* Apply the new formatter */}
          <YAxis tickFormatter={formatYAxisTick} /> 
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="income" fill="#10B981" name="Income" />
          <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeVsExpenseChart;