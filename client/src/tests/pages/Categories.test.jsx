import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Categories from '../../pages/Categories';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Mock react-query hooks
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: () => ({ data: [], isLoading: false }),
    useMutation: () => ({ mutate: vi.fn() }),
    useQueryClient: () => ({}),
  };
});

// Helper to wrap component in QueryClientProvider
const renderWithQueryClient = (ui) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('Categories page (frontend-only)', () => {
  test('renders Categories header', () => {
    renderWithQueryClient(<Categories />);
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  test('switches tabs correctly', () => {
    renderWithQueryClient(<Categories />);
    const expenseTab = screen.getByText('Expense Categories');
    const incomeTab = screen.getByText('Income Categories');

    expect(expenseTab).toHaveClass('border-primary-500');
    expect(incomeTab).toHaveClass('border-transparent');

    fireEvent.click(incomeTab);
    expect(incomeTab).toHaveClass('border-primary-500');
    expect(expenseTab).toHaveClass('border-transparent');
  });

  test('displays empty state message when no categories', () => {
    renderWithQueryClient(<Categories />);
    expect(screen.getByText(/No expense categories yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Get started by creating your first expense category/i)
    ).toBeInTheDocument();
  });
});
