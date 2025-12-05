// src/tests/pages/Budgets.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Budgets from '../../pages/Budgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest'; // ← import vi instead of jest

// Mock API calls to return empty budgets and categories
vi.mock('../../utils/api', () => ({
  api: {
    get: vi.fn((url) => {
      if (url === '/budgets') return Promise.resolve({ data: [] });
      if (url === '/expense-categories') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    }),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const queryClient = new QueryClient();

const renderWithClient = (ui) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('Budgets page', () => {
  test('renders Budget Management header', async () => {
    renderWithClient(<Budgets />);
    const header = await screen.findByText(/Budget Management/i);
    expect(header).toBeInTheDocument();
  });

  test('opens modal when Create Budget button is clicked', async () => {
    renderWithClient(<Budgets />);
    const btn = await screen.findByText(/Create Budget/i);
    fireEvent.click(btn);
    expect(screen.getByText(/Create New Budget/i)).toBeInTheDocument();
  });

  test('displays "No budgets yet" when budget list is empty', async () => {
    renderWithClient(<Budgets />);
    const noBudgetsText = await screen.findByText(/No budgets yet/i);
    expect(noBudgetsText).toBeInTheDocument();
  });
});
