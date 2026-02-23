import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// Components to test
import RequireAuth from "../../../src/components/auth/RequireAuth";
import RedirectIfAuth from "../../../src/components/auth/RedirectAuth";
import RequireAdmin from "../../../src/components/RequireAdmin";

// Mock authService
import { authStore } from "../../../src/services/authService";

vi.mock("../../../src/services/authService", () => ({
  authStore: {
    getToken: vi.fn(),
    getUser: vi.fn(),
  },
}));

describe("Auth Guards", () => {
  /**
   * Helper function to render components in a router environment
   * with defined routes for redirection targets.
   */
  const renderWithRouter = (ui: React.ReactNode) => {
    return render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          {/* Targeted route for the guard */}
          <Route path="/protected" element={ui} />
          
          {/* Redirection targets */}
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("RequireAuth", () => {
    it("redirects to /login when unauthenticated (getToken returns null)", () => {
      vi.mocked(authStore.getToken).mockReturnValue(null);
      
      renderWithRouter(
        <RequireAuth>
          <div>Secret Content</div>
        </RequireAuth>
      );
      
      expect(screen.getByText("Login Page")).toBeInTheDocument();
      expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
    });

    it("renders children when authenticated (getToken returns a token)", () => {
      vi.mocked(authStore.getToken).mockReturnValue("fake-token");
      
      renderWithRouter(
        <RequireAuth>
          <div>Secret Content</div>
        </RequireAuth>
      );
      
      expect(screen.getByText("Secret Content")).toBeInTheDocument();
      expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
    });
  });

  describe("RedirectAuth (RedirectIfAuth)", () => {
    it("redirects to /dashboard when authenticated (getToken returns a token)", () => {
      // Note: The component redirects to /dashboard per source code
      vi.mocked(authStore.getToken).mockReturnValue("fake-token");
      
      renderWithRouter(
        <RedirectIfAuth>
          <div>Login Form</div>
        </RedirectIfAuth>
      );
      
      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
      expect(screen.queryByText("Login Form")).not.toBeInTheDocument();
    });

    it("renders children when unauthenticated (getToken returns null)", () => {
      vi.mocked(authStore.getToken).mockReturnValue(null);
      
      renderWithRouter(
        <RedirectIfAuth>
          <div>Login Form</div>
        </RedirectIfAuth>
      );
      
      expect(screen.getByText("Login Form")).toBeInTheDocument();
    });
  });

  describe("RequireAdmin", () => {
    it("redirects to /login when unauthenticated (getToken returns null)", () => {
      vi.mocked(authStore.getToken).mockReturnValue(null);
      
      renderWithRouter(
        <RequireAdmin>
          <div>Admin Only</div>
        </RequireAdmin>
      );
      
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });

    it("redirects to / when authenticated but NOT staff (is_staff: false)", () => {
      vi.mocked(authStore.getToken).mockReturnValue("fake-token");
      vi.mocked(authStore.getUser).mockReturnValue({ is_staff: false } as any);
      
      renderWithRouter(
        <RequireAdmin>
          <div>Admin Only</div>
        </RequireAdmin>
      );
      
      expect(screen.getByText("Home Page")).toBeInTheDocument();
      expect(screen.queryByText("Admin Only")).not.toBeInTheDocument();
    });

    it("renders children when authenticated and staff (is_staff: true)", () => {
      vi.mocked(authStore.getToken).mockReturnValue("fake-token");
      vi.mocked(authStore.getUser).mockReturnValue({ is_staff: true } as any);
      
      renderWithRouter(
        <RequireAdmin>
          <div>Admin Only</div>
        </RequireAdmin>
      );
      
      expect(screen.getByText("Admin Only")).toBeInTheDocument();
    });
  });
});
