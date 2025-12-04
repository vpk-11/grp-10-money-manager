import React from 'react';
import { render } from 'react-dom';
import { describe, it, expect, afterEach, vi } from 'vitest';
import Profile from '../../pages/Profile';

// Mock the AuthContext so Profile doesn't require a real provider
vi.mock('../../contexts/AuthContext', () => {
  return {
    useAuth: () => ({
      user: {}, // we don't need user details for these two tests
      updateProfile: async () => ({ success: true }),
    }),
  };
});

let container = null;
afterEach(() => {
  if (container) {
    document.body.removeChild(container);
    container = null;
  }
});

function renderProfile() {
  container = document.createElement('div');
  document.body.appendChild(container);
  render(<Profile />, container);
  return container;
}

describe('Profile UI tests (no auth, no API)', () => {
  it('renders Profile component without crashing', () => {
    const dom = renderProfile();
    expect(dom.innerHTML.length).toBeGreaterThan(0);
  });

  it('renders Save button', () => {
    const dom = renderProfile();
    expect(dom.textContent).toMatch(/Save/i);
  });
});

