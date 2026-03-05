import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type React from "react";
import type { User } from "../../../src/services/authService";
import { authStore } from "../../../src/services/authService";

// Components to test
import RequireAuth from "../../../src/components/auth/RequireAuth";
import RedirectIfAuth from "../../../src/components/auth/RedirectAuth";
import RequireAdmin from "../../../src/components/RequireAdmin";

vi.mock("../../../src/services/authService", () => ({
  authStore: {
    getToken: vi.fn(),
    getUser: vi.fn(),
    setUser: vi.fn(),
  },
}));

describe("Auth Guards", () => {
  /**
   * Helper function to render components in a router environment
   * with defined routes for redirection targets.
   * @param ui - The UI to render inside the router.
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
      const spy = vi.spyOn(authStore, "getToken").mockReturnValue(null);
      
      renderWithRouter(
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      );

      expect(screen.getByText("Login Page")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
      expect(spy).toHaveBeenCalled();
    });

    it("renders children when authenticated (getToken returns token)", () => {
      const spy = vi.spyOn(authStore, "getToken").mockReturnValue("valid-token");

      renderWithRouter(
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
      expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("RedirectIfAuth", () => {
    it("redirects to /dashboard when authenticated (getToken returns token)", () => {
      const spy = vi.spyOn(authStore, "getToken").mockReturnValue("valid-token");

      renderWithRouter(
        <RedirectIfAuth>
          <div>Auth Only Content</div>
        </RedirectIfAuth>
      );

      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
      expect(screen.queryByText("Auth Only Content")).not.toBeInTheDocument();
      expect(spy).toHaveBeenCalled();
    });

    it("renders children when unauthenticated (getToken returns null)", () => {
      const spy = vi.spyOn(authStore, "getToken").mockReturnValue(null);

      renderWithRouter(
        <RedirectIfAuth>
          <div>Auth Only Content</div>
        </RedirectIfAuth>
      );

      expect(screen.getByText("Auth Only Content")).toBeInTheDocument();
      expect(screen.queryByText("Dashboard Page")).not.toBeInTheDocument();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("RequireAdmin", () => {
    it("redirects to / when user is not admin", () => {
      const tokenSpy = vi.spyOn(authStore, "getToken").mockReturnValue("non-admin-token");
      const userSpy = vi.spyOn(authStore, "getUser").mockReturnValue({ is_staff: false } as unknown as User);

      renderWithRouter(
        <RequireAdmin>
          <div>Admin Content</div>
        </RequireAdmin>
      );

      expect(screen.getByText("Home Page")).toBeInTheDocument();
      expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
      expect(tokenSpy).toHaveBeenCalled();
      expect(userSpy).toHaveBeenCalled();
    });

    it("renders children when user is admin", () => {
      const tokenSpy = vi.spyOn(authStore, "getToken").mockReturnValue("admin-token");
      const userSpy = vi.spyOn(authStore, "getUser").mockReturnValue({ is_staff: true } as unknown as User);

      renderWithRouter(
        <RequireAdmin>
          <div>Admin Content</div>
        </RequireAdmin>
      );

      expect(screen.getByText("Admin Content")).toBeInTheDocument();
      expect(screen.queryByText("Home Page")).not.toBeInTheDocument();
      expect(tokenSpy).toHaveBeenCalled();
      expect(userSpy).toHaveBeenCalled();
    });
  });
});
