import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { authStore } from "@/services/authService";

// Mock authStore
vi.mock("@/services/authService", () => ({
  authStore: {
    getToken: vi.fn(),
    getUser: vi.fn(),
  },
}));

/**
 * Tests for the RequireAdmin component.
 */
describe("RequireAdmin Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login if user has no token", () => {
    vi.mocked(authStore.getToken.bind(authStore)).mockReturnValue(null);
    
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={
            <RequireAdmin>
              <div data-testid="admin-page">Admin Page</div>
            </RequireAdmin>
          } />
          <Route path="/login" element={<div data-testid="login">Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.queryByTestId("admin-page")).toBeNull();
    expect(screen.getByTestId("login")).toBeDefined();
  });

  it("redirects to / if user is not staff", () => {
    vi.mocked(authStore.getToken.bind(authStore)).mockReturnValue("mock-token");
    vi.mocked(authStore.getUser.bind(authStore)).mockReturnValue({ is_staff: false });
    
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={
            <RequireAdmin>
              <div data-testid="admin-page">Admin Page</div>
            </RequireAdmin>
          } />
          <Route path="/" element={<div data-testid="home">Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.queryByTestId("admin-page")).toBeNull();
    expect(screen.getByTestId("home")).toBeDefined();
  });

  it("renders children if user is staff", () => {
    vi.mocked(authStore.getToken.bind(authStore)).mockReturnValue("mock-token");
    vi.mocked(authStore.getUser.bind(authStore)).mockReturnValue({ is_staff: true });
    
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <RequireAdmin>
          <div data-testid="admin-page">Admin Page</div>
        </RequireAdmin>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId("admin-page")).toBeDefined();
  });
});
