// src/tests/pages/Register.test.jsx
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Register from '../../pages/Register';
import { ThemeProvider } from '../../contexts/ThemeContext'; // wrap component with ThemeProvider

// Mock useAuth so it doesn't need AuthProvider
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    register: vi.fn(() => ({ success: true })),
  }),
}));

afterEach(cleanup);

// Helper to render component with MemoryRouter and ThemeProvider
const renderWithProviders = (ui) => {
  return render(
    <ThemeProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>
  );
};

describe('Register UI tests (no API, no auth)', () => {
  it('renders Register component without crashing', () => {
    renderWithProviders(<Register />);
    const heading = screen.getByRole('heading', { name: /create your account/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders name, email, password, confirm password inputs', () => {
    renderWithProviders(<Register />);
    expect(screen.getByPlaceholderText(/enter your full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm your password/i)).toBeInTheDocument();
  });

  it('renders Create account button', () => {
    renderWithProviders(<Register />);
    const button = screen.getByRole('button', { name: /create account/i });
    expect(button).toBeInTheDocument();
  });

  it('toggles password visibility when clicking eye button', () => {
    renderWithProviders(<Register />);
    
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    // The toggle button is inside the same wrapper as the input
    const toggleButton = passwordInput.parentElement.querySelector('button');

    expect(passwordInput.type).toBe('password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });
});
