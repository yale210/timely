import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginForm from "@/components/auth/LoginForm";
import { authService } from "@/services/authService";

const navigateMock = vi.fn();

vi.mock("@/services/authService", () => ({
  authService: {
    login: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in and navigates to the dashboard", async () => {
    vi.mocked(authService.login).mockResolvedValue({} as never);

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "alice" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(authService.login).toHaveBeenCalledWith({
        username: "alice",
        password: "secret",
      }),
    );
    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });

  it("shows a login error when the request fails", async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error("Bad creds"));

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "alice" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Bad creds")).toBeInTheDocument();
  });
});
