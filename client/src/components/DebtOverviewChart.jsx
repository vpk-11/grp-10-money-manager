import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../utils/format';

const DEBT_COLORS = {
  student_loan: '#3B82F6',
  credit_card: '#EF4444',
  personal_loan: '#F59E0B',
  mortgage: '#8B5CF6',
  auto_loan: '#10B981',
  medical: '#EC4899',
  other: '#6B7280'
};

const DebtOverviewChart = ({ debts }) => {
  if (!debts || debts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No debt data available
      </div>
    );
  }

  const activeDebts = debts.filter(debt => debt.status === 'active');

  const chartData = activeDebts.map(debt => ({
    name: debt.name,
    balance: debt.currentBalance,
    paid: debt.principal - debt.currentBalance,
    type: debt.type,
    color: debt.color || DEBT_COLORS[debt.type] || '#6B7280',
    interestRate: debt.interestRate,
    minimumPayment: debt.minimumPayment
  })).sort((a, b) => b.balance - a.balance);

  const totalDebt = chartData.reduce((sum, item) => sum + item.balance, 0);
  const totalPaid = chartData.reduce((sum, item) => sum + item.paid, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentagePaid = data.paid + data.balance > 0 
        ? ((data.paid / (data.paid + data.balance)) * 100).toFixed(1)
        : 0;
      
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
          <p className="text-sm text-gray-600">
            Balance: {formatCurrency(data.balance)}
          </p>
          <p className="text-sm text-gray-600">
            Paid: {formatCurrency(data.paid)} ({percentagePaid}%)
          </p>
          <p className="text-sm text-gray-600">
            Interest Rate: {data.interestRate}%
          </p>
          <p className="text-sm text-gray-600">
            Min Payment: {formatCurrency(data.minimumPayment)}/mo
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full space-y-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Debt</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="name" width={150} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="balance" name="Current Balance" stackId="a">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
          <Bar dataKey="paid" fill="#10B981" name="Amount Paid" stackId="a" />
        </BarChart>
      </ResponsiveContainer>

      {/* Debt list with details */}
      <div className="mt-6 space-y-3">
        {chartData.map((debt, index) => {
          const percentagePaid = debt.paid + debt.balance > 0 
            ? ((debt.paid / (debt.paid + debt.balance)) * 100).toFixed(1)
            : 0;
          
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: debt.color }}
                />
                <div>
                  <p className="font-medium text-gray-900">{debt.name}</p>
                  <p className="text-xs text-gray-500">
                    {debt.interestRate}% APR • {formatCurrency(debt.minimumPayment)}/mo
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(debt.balance)}</p>
                <p className="text-xs text-green-600">{percentagePaid}% paid off</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DebtOverviewChart;
