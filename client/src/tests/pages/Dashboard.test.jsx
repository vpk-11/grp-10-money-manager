// src/tests/pages/Dashboard.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Dashboard from '../../pages/Dashboard.jsx';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  DollarSign: () => <div>DollarSign</div>,
  TrendingUp: () => <div>TrendingUp</div>,
  TrendingDown: () => <div>TrendingDown</div>,
  Wallet: () => <div>Wallet</div>,
  Plus: () => <div>Plus</div>,
}));

// Mock formatCurrency utility
vi.mock('../../utils/format', () => ({
  formatCurrency: (num) => `$${num}`,
}));

// Mock useQuery from react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      totalBalance: 1000,
      monthlyExpenses: 200,
      monthlyIncome: 500,
      yearlyExpenses: 2400,
      yearlyIncome: 6000,
      accounts: 3,
      recentTransactions: [
        { _id: '1', amount: 100, description: 'Test Income', categoryId: { name: 'Salary' }, accountId: { name: 'Bank' }, date: '2025-12-01' },
        { _id: '2', amount: -50, description: 'Test Expense', categoryId: { name: 'Food' }, accountId: { name: 'Wallet' }, date: '2025-12-02' },
      ],
      expensesChange: -10,
      incomeChange: 20,
      netChange: 15,
    },
    isLoading: false,
    error: null,
  }),
}));

test('renders Dashboard component', () => {
  render(<Dashboard />);
  expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  expect(screen.getByText('$1000')).toBeInTheDocument(); // Total Balance
  expect(screen.getByText('$500')).toBeInTheDocument(); // Monthly Income
  expect(screen.getByText('$200')).toBeInTheDocument(); // Monthly Expenses
});

test('renders recent transactions', () => {
  render(<Dashboard />);
  expect(screen.getByText(/test income/i)).toBeInTheDocument();
  expect(screen.getByText(/test expense/i)).toBeInTheDocument();
});

test('renders quick stats', () => {
  render(<Dashboard />);
  expect(screen.getByText(/total accounts/i)).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument(); // accounts
  expect(screen.getByText('$6000')).toBeInTheDocument(); // Yearly Income
  expect(screen.getByText('$2400')).toBeInTheDocument(); // Yearly Expenses
});
