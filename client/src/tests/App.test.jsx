import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "../App";
import { AuthProvider } from "../contexts/AuthContext";
import { vi } from "vitest";

// Mock AuthProvider
const MockAuthProvider = ({ children }) => {
  const mockAuth = {
    user: { email: "admin@test.com", name: "Admin" },
    login: vi.fn(),
    logout: vi.fn(),
  };
  return <AuthProvider value={mockAuth}>{children}</AuthProvider>;
};

// QueryClient for React Query
const queryClient = new QueryClient();

// Helper to render with providers
const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <MockAuthProvider>{ui}</MockAuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe("App component", () => {
  test("renders App component without crashing", () => {
    renderWithProviders(<App />);

    // Look for something always in App, e.g., "Sign in" button
    const signInBtn = screen.getByRole("button", { name: /sign in/i });
    expect(signInBtn).toBeInTheDocument();
  });
});
