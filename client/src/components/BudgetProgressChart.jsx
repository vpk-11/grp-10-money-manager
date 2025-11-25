import React from 'react';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/format';

const BudgetProgressChart = ({ budgets }) => {
  if (!budgets || budgets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No budget data available
      </div>
    );
  }

  const sortedBudgets = [...budgets].sort((a, b) => b.percentageUsed - a.percentageUsed);

  const getStatusColor = (percentageUsed) => {
    if (percentageUsed >= 100) return 'bg-red-500';
    if (percentageUsed >= 80) return 'bg-orange-500';
    if (percentageUsed >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (percentageUsed) => {
    if (percentageUsed >= 90) {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
    if (percentageUsed >= 100) {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  const getStatusText = (percentageUsed) => {
    if (percentageUsed >= 100) return 'Exceeded';
    if (percentageUsed >= 80) return 'Warning';
    return 'On Track';
  };

  return (
    <div className="space-y-4">
      {sortedBudgets.map((budget) => {
        const percentageUsed = Math.min(budget.percentageUsed || 0, 100);
        const actualPercentage = budget.percentageUsed || 0;
        
        return (
          <div key={budget._id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(actualPercentage)}
                <span className="font-medium text-gray-900">
                  {budget.categoryId?.name || 'Unknown Category'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                </span>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  actualPercentage >= 100 ? 'bg-red-100 text-red-700' :
                  actualPercentage >= 80 ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {getStatusText(actualPercentage)}
                </span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getStatusColor(actualPercentage)}`}
                style={{ width: `${percentageUsed}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>{actualPercentage.toFixed(1)}% used</span>
              <span>{formatCurrency(budget.remaining)} remaining</span>
            </div>
          </div>
        );
      })}
      
      {budgets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No budgets set yet</p>
          <p className="text-sm">Create a budget to track your spending</p>
        </div>
      )}
    </div>
  );
};

export default BudgetProgressChart;
