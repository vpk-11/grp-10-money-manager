import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Chatbot from '../../pages/Chatbot';

// Mock scrollIntoView (JSDOM doesn't implement it)
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
});

const renderWithQueryClient = (ui) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

// Test: user can type in the textarea
test('allows user to type', () => {
  renderWithQueryClient(<Chatbot />);
  const textarea = screen.getByPlaceholderText(/ask me about your finances/i);
  fireEvent.change(textarea, { target: { value: 'Show my spending' } });
  expect(textarea.value).toBe('Show my spending');
});

// Test: quick questions populate input
test('quick questions populate input', () => {
  renderWithQueryClient(<Chatbot />);
  const quickQuestion = screen.getByText(/financial summary/i);
  fireEvent.click(quickQuestion);

  const textarea = screen.getByPlaceholderText(/ask me about your finances/i);
  expect(textarea.value).toBe('Financial summary');
});
