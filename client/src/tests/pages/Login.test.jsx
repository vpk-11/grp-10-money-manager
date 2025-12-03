// src/tests/pages/Login.ui.test.jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';

// Mock useAuth so no AuthProvider is needed
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

// Helper to wrap component with BrowserRouter
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Login Component (UI only)', () => {
  it('renders header', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('Sign in to your account')).toBeDefined();
  });

  it('renders email and password fields', () => {
    renderWithRouter(<Login />);
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeDefined();
  });

  it('renders Sign in button', () => {
    renderWithRouter(<Login />);
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeDefined();
  });
});
