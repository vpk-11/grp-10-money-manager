import React from 'react';
import { useQuery } from 'react-query';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/format';

const Dashboard = () => {
  const { data, isLoading } = useQuery('dashboardData', () => api.get('/dashboard'));

  if (isLoading) return <LoadingSpinner />;

  const { totalIncome, totalExpense, balance } = data.data;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="card">
        <DollarSign /> Total Income: {formatCurrency(totalIncome)}
      </div>
      <div className="card">
        <TrendingDown /> Total Expense: {formatCurrency(totalExpense)}
      </div>
      <div className="card">
        <Wallet /> Balance: {formatCurrency(balance)}
      </div>
    </div>
  );
};

export default Dashboard;
