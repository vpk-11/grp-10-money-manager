// src/tests/pages/Login.ui.test.jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock useAuth so no AuthProvider is needed
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

// Helper to wrap component with BrowserRouter + ThemeProvider
const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        {ui}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Login Component (UI only)', () => {
  it('renders header', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText('Sign in to your account')).toBeDefined();
  });

  it('renders email and password fields', () => {
    renderWithProviders(<Login />);
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeDefined();
  });

  it('renders Sign in button', () => {
    renderWithProviders(<Login />);
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeDefined();
  });
});
