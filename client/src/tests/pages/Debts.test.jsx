// src/tests/pages/Debts.test.jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Debts from '../../pages/Debts';

// Wrap component in QueryClientProvider
const renderWithClient = (ui) => {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

// Mock useQuery to avoid loading spinner
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: () => ({ data: [], isLoading: false }),
  };
});

describe('Debts Component (UI only)', () => {
  it('renders header', () => {
    renderWithClient(<Debts />);
    expect(screen.getByText('Debt Management')).toBeDefined();
    expect(screen.getByText('Track and conquer your debts')).toBeDefined();
  });

  it('renders Add Debt button', () => {
    renderWithClient(<Debts />);
    expect(screen.getByText(/Add Debt/i)).toBeDefined();
  });
});
