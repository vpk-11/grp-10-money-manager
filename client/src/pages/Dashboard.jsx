import React from 'react';
import { useQuery } from '@tanstack/react-query'; // changed from 'react-query'
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/format';

const Dashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/users/dashboard').then(res => res.data),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">Error loading dashboard data</div>;

  const {
    totalBalance = 0,
    monthlyExpenses = 0,
    monthlyIncome = 0,
    yearlyExpenses = 0,
    yearlyIncome = 0,
    accounts = 0,
    recentTransactions = []
  } = dashboardData || {};

  const monthlyNet = monthlyIncome - monthlyExpenses;
  const yearlyNet = yearlyIncome - yearlyExpenses;

  const stats = [
    {
      name: 'Total Balance',
      value: formatCurrency(totalBalance),
      change: '+12%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Monthly Income',
      value: formatCurrency(monthlyIncome),
      change: '+8%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Monthly Expenses',
      value: formatCurrency(monthlyExpenses),
      change: '-3%',
      changeType: 'negative',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      name: 'Net Income',
      value: formatCurrency(monthlyNet),
      change: monthlyNet >= 0 ? '+15%' : '-5%',
      changeType: monthlyNet >= 0 ? 'positive' : 'negative',
      icon: Wallet,
      color: monthlyNet >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: monthlyNet >= 0 ? 'bg-green-100' : 'bg-red-100'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button className="btn btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last month
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          <div className="space-y-4">
            {recentTransactions?.length > 0 ? (
              recentTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${
                      transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.amount > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.categoryId?.name} • {transaction.accountId?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent transactions</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Accounts</span>
              <span className="text-lg font-semibold text-gray-900">{accounts || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Yearly Income</span>
              <span className="text-lg font-semibold text-green-600">
                {formatCurrency(yearlyIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Yearly Expenses</span>
              <span className="text-lg font-semibold text-red-600">
                {formatCurrency(yearlyExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Yearly Net</span>
              <span className={`text-lg font-semibold ${
                yearlyNet >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(yearlyNet)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

