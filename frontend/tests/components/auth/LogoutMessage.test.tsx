import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryRouter, useNavigate } from "react-router-dom";
import LogoutMessage from "@/components/auth/LogoutMessage";
import { authService } from "@/services/authService";

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock authService
vi.mock("@/services/authService", () => ({
  authService: {
    logout: vi.fn(),
  },
}));

const mockedUseNavigate = vi.mocked(useNavigate);

describe("LogoutMessage Component", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("displays the initial logout message", () => {
    vi.spyOn(authService, 'logout').mockReturnValue(new Promise(() => {
      /* Never resolves */
    }));
    render(
      <MemoryRouter>
        <LogoutMessage />
      </MemoryRouter>
    );
    expect(screen.getByText("Signing you out...")).toBeDefined();
  });

  it("calls authService.logout on mount", () => {
    const logoutSpy = vi.spyOn(authService, 'logout').mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <LogoutMessage />
      </MemoryRouter>
    );
    expect(logoutSpy).toHaveBeenCalled();
  });

  it("navigates to /login after logout succeeds", async () => {
    vi.spyOn(authService, 'logout').mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <LogoutMessage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
    });
  });

  it("displays error message and navigates to /login if logout fails", async () => {
    vi.spyOn(authService, 'logout').mockRejectedValue(new Error("Logout error"));
    render(
      <MemoryRouter>
        <LogoutMessage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText("Logout error")).toBeDefined();
    });
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
    });
  });

  it("displays default error message if logout fails with non-Error", async () => {
    vi.spyOn(authService, 'logout').mockRejectedValue("Some error");
    render(
      <MemoryRouter>
        <LogoutMessage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText("Logout failed")).toBeDefined();
    });
  });

  it("does nothing if unmounted before logout completes", async () => {
    let resolveLogout: (value: undefined) => void;
    const logoutPromise = new Promise<undefined>((resolve) => {
      resolveLogout = resolve;
    });
    const logoutSpy = vi.spyOn(authService, 'logout').mockReturnValue(logoutPromise);

    const { unmount } = render(
      <MemoryRouter>
        <LogoutMessage />
      </MemoryRouter>
    );

    unmount();
    resolveLogout!(undefined);

    // Wait a bit to ensure any async updates would have happened
    await new Promise((r) => setTimeout(r, 10));

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(logoutSpy).toHaveBeenCalled();
  });
});
