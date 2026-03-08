import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RedirectIfAuth from "@/components/auth/RedirectAuth";
import { authStore } from "@/services/authService";

// Mock authStore
vi.mock("@/services/authService", () => ({
  authStore: {
    getToken: vi.fn(),
  },
}));

const mockedAuthStore = vi.mocked(authStore);

/**
 * Tests for the RedirectIfAuth component.
 */
describe("RedirectIfAuth Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /dashboard if user has a token", () => {
    mockedAuthStore.getToken.mockReturnValue("mock-token");
    
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={
            <RedirectIfAuth>
              <div data-testid="login-page">Login Page</div>
            </RedirectIfAuth>
          } />
          <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.queryByTestId("login-page")).toBeNull();
    expect(screen.getByTestId("dashboard")).toBeDefined();
  });

  it("renders children if user has no token", () => {
    mockedAuthStore.getToken.mockReturnValue(null);
    
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <RedirectIfAuth>
          <div data-testid="login-page">Login Page</div>
        </RedirectIfAuth>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId("login-page")).toBeDefined();
  });
});
