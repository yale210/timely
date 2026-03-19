import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AppLayout from "@/layouts/AppLayout";
import { MemoryRouter } from "react-router-dom";

// Mock AppNavbar to avoid issues with its own dependencies
vi.mock("@/components/index", () => ({
  AppNavbar: () => <nav data-testid="app-navbar">Navbar</nav>,
  XPToast: () => null,
  LevelUpToast: () => null,
}));

describe("AppLayout Component", () => {
  it("renders with navbar by default", () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div data-testid="content">Content</div>
        </AppLayout>
      </MemoryRouter>
    );
    expect(screen.getByTestId("app-navbar")).toBeDefined();
    expect(screen.getByTestId("content")).toBeDefined();
  });

  it("renders without navbar when showNavbar is false", () => {
    render(
      <MemoryRouter>
        <AppLayout showNavbar={false}>
          <div data-testid="content">Content</div>
        </AppLayout>
      </MemoryRouter>
    );
    expect(screen.queryByTestId("app-navbar")).toBeNull();
    expect(screen.getByTestId("content")).toBeDefined();
  });
});
