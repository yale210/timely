import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from "vitest";
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
const logoutMock = authService.logout.bind(authService) as Mock;

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
    logoutMock.mockReturnValue(new Promise(() => {
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
    logoutMock.mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <LogoutMessage />
      </MemoryRouter>
    );
    expect(logoutMock).toHaveBeenCalled();
  });

  it("navigates to /login after logout succeeds", async () => {
    logoutMock.mockResolvedValue(undefined);
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
    logoutMock.mockRejectedValue(new Error("Logout error"));
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
    logoutMock.mockRejectedValue("Some error");
    render(
      <MemoryRouter>
        <LogoutMessage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText("Logout failed")).toBeDefined();
    });
  });

  it("does not update state if unmounted before logout completes", async () => {
    let resolveLogout: (value: undefined) => void;
    const logoutPromise = new Promise<undefined>((resolve) => {
      resolveLogout = resolve;
    });
    logoutMock.mockReturnValue(logoutPromise);

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
  });
});
