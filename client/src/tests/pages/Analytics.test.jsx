// src/tests/pages/Analytics.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import Analytics from '../../pages/Analytics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import * as api from '../../utils/api';

// --------------------
// MOCKS
// --------------------
vi.mock('../../utils/api', () => ({
  fetchExpenses: vi.fn(),
  fetchIncomes: vi.fn(),
}));

// Mock ResizeObserver (required by Recharts ResponsiveContainer)
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

// --------------------
// TEST SETUP
// --------------------
const queryClient = new QueryClient();

const renderWithClient = (ui) =>
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// --------------------
// TESTS
// --------------------
describe('Analytics page', () => {
  test('renders loading spinner while fetching data', async () => {
    // Never-resolving promises to simulate loading
    api.fetchExpenses.mockReturnValue(new Promise(() => {}));
    api.fetchIncomes.mockReturnValue(new Promise(() => {}));

    renderWithClient(<Analytics />);

    // Spinner has class 'animate-spin' (Tailwind spinner)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
