// src/tests/pages/Chatbot.test.jsx
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Chatbot from '../../pages/Chatbot';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock scrollIntoView
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = () => {};
});

// Helper to render Chatbot
const renderChatbot = () => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Chatbot />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Chatbot basic UI test', () => {
  it('renders message input and Send button', () => {
    renderChatbot();

    // textarea
    const input = screen.getByPlaceholderText(/Ask me about your finances/i);
    expect(input).toBeInTheDocument();

    // Send button with SVG inside
    const sendButton = screen.getByRole('button', { name: '' });
    expect(sendButton.querySelector('svg')).toBeInTheDocument();
  });
});
