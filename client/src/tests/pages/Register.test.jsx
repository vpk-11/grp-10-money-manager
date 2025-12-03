// src/tests/pages/Register.test.jsx
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Register from '../../pages/Register';

// Mock useAuth so it doesn't need AuthProvider
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    register: vi.fn(() => ({ success: true })),
  }),
}));

afterEach(cleanup);

describe('Register UI tests (no API, no auth)', () => {
  it('renders Register component without crashing', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    const heading = screen.getByRole('heading', { name: /create your account/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders name, email, password, confirm password inputs', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/enter your full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm your password/i)).toBeInTheDocument();
  });

  it('renders Create account button', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    const button = screen.getByRole('button', { name: /create account/i });
    expect(button).toBeInTheDocument();
  });

  it('toggles password visibility when clicking eye button', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const toggleButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'));

    expect(passwordInput.type).toBe('password');
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });
});
