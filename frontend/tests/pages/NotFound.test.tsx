import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "@/pages/NotFound";

const { mockGetToken } = vi.hoisted(() => ({
  mockGetToken: vi.fn(),
}));

vi.mock("@/layouts/AppLayout", () => ({
  default: ({
    children,
    showNavbar = true,
  }: {
    children: ReactNode;
    showNavbar?: boolean;
  }) => <div data-show-navbar={String(showNavbar)}>{children}</div>,
}));

vi.mock("@/services/authService", () => ({
  authStore: {
    getToken: mockGetToken,
  },
}));

describe("NotFound page", () => {
  it("renders a public 404 when logged out", () => {
    mockGetToken.mockReturnValue(null);

    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByText("404")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Go Home" })).toHaveAttribute("href", "/");
    expect(screen.getByText("404").closest("[data-show-navbar='false']")).not.toBeNull();
  });

  it("keeps the app navbar when authenticated", () => {
    mockGetToken.mockReturnValue("token-123");

    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Go Overview" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByText("404").closest("[data-show-navbar='true']")).not.toBeNull();
  });
});
