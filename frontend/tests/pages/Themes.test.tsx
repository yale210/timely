import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Themes from "@/pages/Themes";

// Mock AppNavbar to avoid context issues
vi.mock("@/components/index.ts", async () => {
  const actual = await vi.importActual("@/components/index.ts");
  return {
    ...actual,
    AppNavbar: () => <div data-testid="app-navbar">Navbar</div>,
  };
});

describe("Themes Page", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.font;
    vi.clearAllMocks();
  });

  it("renders theme and font buttons", () => {
    render(
      <MemoryRouter>
        <Themes />
      </MemoryRouter>
    );
    expect(screen.getByText("Themes")).toBeDefined();
    expect(screen.getByText("Fonts")).toBeDefined();
    
    // Check for some buttons
    expect(screen.getByRole("button", { name: /dark/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /poppins/i })).toBeDefined();
  });

  it("changes theme when a theme button is clicked", () => {
    render(
      <MemoryRouter>
        <Themes />
      </MemoryRouter>
    );
    
    const darkBtn = screen.getByRole("button", { name: /dark/i });
    fireEvent.click(darkBtn);
    
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("changes font when a font button is clicked", () => {
    render(
      <MemoryRouter>
        <Themes />
      </MemoryRouter>
    );
    
    const poppinsBtn = screen.getByRole("button", { name: /poppins/i });
    fireEvent.click(poppinsBtn);
    
    expect(document.documentElement.dataset.font).toBe("poppins");
    expect(localStorage.getItem("font")).toBe("poppins");
  });
});
