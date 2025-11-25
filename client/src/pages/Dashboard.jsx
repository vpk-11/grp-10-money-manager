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
    recentTransactions = [],
    expensesChange = 0,
    incomeChange = 0,
    netChange = 0
  } = dashboardData || {};
  // console.log(dashboardData);

  const monthlyNet = monthlyIncome - monthlyExpenses;
  const yearlyNet = yearlyIncome - yearlyExpenses;

  // Format percentage change display
  const formatChange = (change) => {
    if (change === 0) return '0%';
    return `${change > 0 ? '+' : ''}${change}%`;
  };

  const stats = [
    {
      name: 'Total Balance',
      value: formatCurrency(totalBalance),
      change: totalBalance >= 0 ? 'Current balance' : 'Negative balance',
      changeType: totalBalance >= 0 ? 'positive' : 'negative',
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Monthly Income',
      value: formatCurrency(monthlyIncome),
      change: `${formatChange(incomeChange)} from last month`,
      changeType: incomeChange >= 0 ? 'positive' : 'negative',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Monthly Expenses',
      value: formatCurrency(monthlyExpenses),
      change: `${formatChange(expensesChange)} from last month`,
      changeType: expensesChange <= 0 ? 'positive' : 'negative',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      name: 'Net Income',
      value: formatCurrency(monthlyNet),
      change: `${formatChange(netChange)} from last month`,
      changeType: netChange >= 0 ? 'positive' : 'negative',
      icon: Wallet,
      color: monthlyNet >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: monthlyNet >= 0 ? 'bg-green-100' : 'bg-red-100'
    }
  ];

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent dark:opacity-95">
            Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1 dark:text-gray-300">Welcome back! Here's your financial overview</p>
        </div>
        {/* <button className="btn btn-primary flex items-center justify-center w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </button> */}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="stat-card bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={`inline-flex p-3 rounded-xl ${stat.bgColor} shadow-soft mb-3 dark:opacity-90`}>
                    <Icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 dark:text-gray-300">{stat.name}</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 break-all dark:text-gray-100">{stat.value}</p>
                </div>
              </div>
              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center">
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <p className={`text-xs font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'} dark:text-opacity-90`}>
                    {stat.change}
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h3>
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
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4 dark:text-gray-300">No recent transactions</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Stats</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Total Accounts</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{accounts || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Yearly Income</span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(yearlyIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Yearly Expenses</span>
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(yearlyExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Yearly Net</span>
              <span className={`text-lg font-semibold ${
                yearlyNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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

