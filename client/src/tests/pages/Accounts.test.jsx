import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import Accounts from "../../pages/Accounts";
import { AuthProvider } from "../../contexts/AuthContext";
import { vi } from "vitest";

// Mock React Query's useQuery to return instant data
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: [{ id: 1, name: "Test Account" }],
      isLoading: false,
      error: null,
    })),
  };
});

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

describe("Accounts page", () => {
  test("renders Accounts page correctly", () => {
    renderWithProviders(<Accounts />);

    // Check heading
    const heading = screen.getByText(/Accounts/i);
    expect(heading).toBeInTheDocument();

    // Check mocked account
    const accountName = screen.getByText(/Test Account/i);
    expect(accountName).toBeInTheDocument();
  });
});
