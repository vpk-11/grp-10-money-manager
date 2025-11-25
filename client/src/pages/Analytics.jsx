import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ExpenseByCategoryChart from '../components/ExpenseByCategoryChart';
import IncomeVsExpenseChart from '../components/IncomeVsExpenseChart';
import BudgetProgressChart from '../components/BudgetProgressChart';
import DebtOverviewChart from '../components/DebtOverviewChart';
import SpendingTrendChart from '../components/SpendingTrendChart';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('6months'); // 1month, 3months, 6months, 1year

  // Fetch expenses
  const { data: expenses, isLoading: expensesLoading, error: expensesError } = useQuery({
    queryKey: ['expenses', timeRange],
    queryFn: async () => {
      console.log('Fetching expenses...');
      const response = await api.get('/expenses');
      console.log('Expenses response:', response.data);
      const allExpenses = response.data.expenses || response.data; // Handle both response formats
      console.log('All expenses count:', allExpenses.length);
      
      // Filter by time range
      const now = new Date();
      const cutoffDate = new Date();
      
      switch(timeRange) {
        case '1month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case '1year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          cutoffDate.setMonth(now.getMonth() - 6);
      }
      
      const filtered = allExpenses.filter(exp => new Date(exp.date) >= cutoffDate);
      console.log('Filtered expenses count:', filtered.length);
      return filtered;
    }
  });

  // Fetch incomes
  const { data: incomes, isLoading: incomesLoading, error: incomesError } = useQuery({
    queryKey: ['incomes', timeRange],
    queryFn: async () => {
      const response = await api.get('/incomes');
      const allIncomes = response.data.incomes || response.data; // Handle both response formats
      
      const now = new Date();
      const cutoffDate = new Date();
      
      switch(timeRange) {
        case '1month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case '1year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          cutoffDate.setMonth(now.getMonth() - 6);
      }
      
      return allIncomes.filter(inc => new Date(inc.date) >= cutoffDate);
    }
  });

  // Fetch budgets
  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.get('/budgets').then(res => res.data)
  });

  // Fetch debts
  const { data: debts, isLoading: debtsLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: () => api.get('/debts').then(res => res.data)
  });

  // Fetch budget alerts
  const { data: budgetAlerts } = useQuery({
    queryKey: ['budget-alerts'],
    queryFn: () => api.get('/budgets/alerts/check').then(res => res.data),
    refetchInterval: 60000 // Check every minute
  });

  // Fetch debt reminders
  const { data: debtReminders } = useQuery({
    queryKey: ['debt-reminders'],
    queryFn: () => api.get('/debts/reminders/upcoming').then(res => res.data),
    refetchInterval: 60000
  });

  const isLoading = expensesLoading || incomesLoading || budgetsLoading || debtsLoading;

  // Debug logging
  console.log('Analytics render - expenses:', expenses?.length, 'incomes:', incomes?.length);
  console.log('Expenses error:', expensesError);
  console.log('Incomes error:', incomesError);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Financial Analytics
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive overview of your financial health
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input py-2 text-sm w-full sm:w-auto"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Alerts Section */}
      {(budgetAlerts?.length > 0 || debtReminders?.length > 0) && (
        <div className="space-y-2 md:space-y-3">
          {budgetAlerts?.map((alert, index) => (
            <div key={index} className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-warning-500 rounded-lg p-3 md:p-4 flex items-start space-x-3 shadow-soft animate-slideIn">
              <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-orange-900 text-sm md:text-base">{alert.message}</p>
                <p className="text-xs md:text-sm text-orange-700 mt-1">
                  Spent: ${alert.spent.toFixed(2)} of ${alert.amount.toFixed(2)} 
                  ({alert.percentageUsed.toFixed(1)}%)
                </p>
              </div>
            </div>
          ))}
          
          {debtReminders?.map((reminder, index) => (
            <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-primary-500 rounded-lg p-3 md:p-4 flex items-start space-x-3 shadow-soft animate-slideIn">
              <CreditCard className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-blue-900 text-sm md:text-base">{reminder.message}</p>
                <p className="text-xs md:text-sm text-blue-700 mt-1">
                  Minimum payment: ${reminder.minimumPayment.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Income vs Expenses */}
        <div className="card hover:shadow-hover transition-all duration-300 overflow-hidden dark:bg-gray-800">
          <div className="card-header flex items-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg dark:bg-gray-900 dark:bg-none">
            <BarChart3 className="h-5 w-5 text-emerald-600 mr-2" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">Income vs Expenses</h3>
          </div>
          <div className="overflow-x-auto">
            <IncomeVsExpenseChart incomes={incomes} expenses={expenses} period="monthly" />
          </div>
        </div>

        {/* Expense by Category */}
        <div className="card hover:shadow-hover transition-all duration-300 overflow-hidden dark:bg-gray-800">
          <div className="card-header flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg dark:bg-gray-900 dark:bg-none">
            <PieChartIcon className="h-5 w-5 text-indigo-600 mr-2" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">Expenses by Category</h3>
          </div>
          <div className="overflow-x-auto">
            <ExpenseByCategoryChart expenses={expenses} />
          </div>
        </div>

        {/* Spending Trend */}
        <div className="card lg:col-span-2 hover:shadow-hover transition-all duration-300 overflow-hidden dark:bg-gray-800">
          <div className="card-header flex items-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg dark:bg-gray-900 dark:bg-none">
            <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Spending Trend</h3>
          </div>
          <SpendingTrendChart expenses={expenses} period="daily" />
        </div>

        {/* Budget Progress */}
        <div className="card hover:shadow-lg transition-shadow duration-200 dark:bg-gray-800">
          <div className="card-header flex items-center bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg dark:bg-gray-900 dark:bg-none">
            <TrendingUp className="h-5 w-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Budget Progress</h3>
          </div>
          <BudgetProgressChart budgets={budgets} />
        </div>

        {/* Debt Overview */}
        <div className="card hover:shadow-lg transition-shadow duration-200 dark:bg-gray-800">
          <div className="card-header flex items-center bg-gradient-to-r from-red-50 to-rose-50 rounded-t-lg dark:bg-gray-900 dark:bg-none">
            <CreditCard className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Debt Overview</h3>
          </div>
          <DebtOverviewChart debts={debts} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow duration-200 dark:bg-gray-800 dark:bg-none">
          <p className="text-sm text-gray-700 font-medium dark:text-gray-200">Total Income</p>
          <p className="text-2xl font-bold text-blue-600 mt-2 dark:text-blue-400">
            ${incomes?.reduce((sum, inc) => sum + inc.amount, 0).toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className="card bg-gradient-to-br from-red-50 to-red-100 hover:shadow-lg transition-shadow duration-200 dark:bg-gray-800 dark:bg-none">
          <p className="text-sm text-gray-700 font-medium dark:text-gray-200">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600 mt-2 dark:text-red-400">
            ${expenses?.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className="card bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow duration-200 dark:bg-gray-800 dark:bg-none">
          <p className="text-sm text-gray-700 font-medium dark:text-gray-200">Net Savings</p>
          <p className="text-2xl font-bold text-green-600 mt-2 dark:text-green-400">
            ${((incomes?.reduce((sum, inc) => sum + inc.amount, 0) || 0) - 
               (expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0)).toFixed(2)}
          </p>
        </div>
        
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-shadow duration-200 dark:bg-gray-800 dark:bg-none">
          <p className="text-sm text-gray-700 font-medium dark:text-gray-200">Active Budgets</p>
          <p className="text-2xl font-bold text-purple-600 mt-2 dark:text-purple-400">
            {budgets?.filter(b => b.isActive).length || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;