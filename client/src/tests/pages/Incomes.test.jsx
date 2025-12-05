// src/tests/pages/Incomes.test.jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Incomes from '../../pages/Incomes';

// Wrap component with QueryClientProvider
const renderWithClient = (ui) => {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

// Mock react-query useQuery for UI-only testing
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: ({ queryKey }) => {
      if (queryKey[0] === 'incomes') return { data: { incomes: [] }, isLoading: false };
      if (queryKey[0] === 'income-categories') return { data: [], isLoading: false };
      if (queryKey[0] === 'accounts') return { data: [], isLoading: false };
      return { data: [], isLoading: false };
    },
  };
});

describe('Incomes Component (UI only)', () => {
  it('renders header', () => {
    renderWithClient(<Incomes />);
    expect(screen.getByText('Incomes')).toBeDefined();
  });

  it('renders Add Income button', () => {
    renderWithClient(<Incomes />);
    expect(screen.getByText(/Add Income/i)).toBeDefined();
  });

  it('shows "No incomes found" message when list is empty', () => {
    renderWithClient(<Incomes />);
    expect(screen.getByText(/No incomes found/i)).toBeDefined();
  });
});
