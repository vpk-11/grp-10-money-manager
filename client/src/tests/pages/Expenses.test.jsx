// src/tests/pages/Expenses.test.jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Expenses from '../../pages/Expenses';

// Wrap component in QueryClientProvider to avoid react-query errors
const renderWithClient = (ui) => {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

// Mock useQuery to return empty arrays for UI-only testing
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: ({ queryKey }) => {
      if (queryKey[0] === 'expenses') return { data: { expenses: [] }, isLoading: false };
      if (queryKey[0] === 'expense-categories') return { data: [], isLoading: false };
      if (queryKey[0] === 'accounts') return { data: [], isLoading: false };
      return { data: [], isLoading: false };
    },
  };
});

describe('Expenses Component (UI only)', () => {
  it('renders header', () => {
    renderWithClient(<Expenses />);
    expect(screen.getByText('Expenses')).toBeDefined();
  });

  it('renders Add Expense button', () => {
    renderWithClient(<Expenses />);
    expect(screen.getByText(/Add Expense/i)).toBeDefined();
  });

  it('shows "No expenses found" message when list is empty', () => {
    renderWithClient(<Expenses />);
    expect(screen.getByText(/No expenses found/i)).toBeDefined();
  });
});
