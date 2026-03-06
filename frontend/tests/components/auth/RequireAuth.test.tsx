import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "@/components/auth/RequireAuth";
import { authStore } from "@/services/authService";

// Mock authStore
vi.mock("@/services/authService", () => ({
  authStore: {
    getToken: vi.fn(),
  },
}));

/**
 * Tests for the RequireAuth component.
 */
describe("RequireAuth Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login if user has no token", () => {
    vi.mocked(authStore.getToken.bind(authStore)).mockReturnValue(null);
    
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={
            <RequireAuth>
              <div data-testid="protected-page">Protected Page</div>
            </RequireAuth>
          } />
          <Route path="/login" element={<div data-testid="login">Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.queryByTestId("protected-page")).toBeNull();
    expect(screen.getByTestId("login")).toBeDefined();
  });

  it("renders children if user has a token", () => {
    vi.mocked(authStore.getToken.bind(authStore)).mockReturnValue("mock-token");
    
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <RequireAuth>
          <div data-testid="protected-page">Protected Page</div>
        </RequireAuth>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId("protected-page")).toBeDefined();
  });
});
