import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignupForm from "@/components/auth/SignupForm";
import { authService } from "@/services/authService";

const navigateMock = vi.fn();

vi.mock("@/services/authService", () => ({
  authService: {
    register: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("SignupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prevents submission when passwords do not match", async () => {
    render(
      <MemoryRouter>
        <SignupForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "alice" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "different" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText("Try again, your passwords did not match."),
    ).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it("registers and navigates to login", async () => {
    vi.mocked(authService.register).mockResolvedValue({} as never);

    render(
      <MemoryRouter>
        <SignupForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "alice" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() =>
      expect(authService.register).toHaveBeenCalledWith({
        username: "alice",
        email: "alice@example.com",
        password: "secret",
        password2: "secret",
      }),
    );
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });
});
