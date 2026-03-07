import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import Logout from "@/pages/Authentication/Logout";

// Mock the components
vi.mock("@/components", () => ({
  HomeNavbar: () => <div data-testid="home-navbar">HomeNavbar</div>,
  LogoutMessage: () => <div data-testid="logout-message">LogoutMessage</div>,
  Footer: () => <div data-testid="footer">Footer</div>,
}));

describe("Logout Page", () => {
  it("renders correctly with Navbar, LogoutMessage, and Footer", () => {
    render(<Logout />);
    
    expect(screen.getByTestId("home-navbar")).toBeDefined();
    expect(screen.getByTestId("logout-message")).toBeDefined();
    expect(screen.getByTestId("footer")).toBeDefined();
  });
});
