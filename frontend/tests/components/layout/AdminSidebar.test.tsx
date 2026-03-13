import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminSidebar from "@/components/layout/AdminSidebar";

describe("AdminSidebar Component", () => {
  const mockOnClose = vi.fn();

  it("renders all sidebar items", () => {
    render(
      <MemoryRouter>
        <AdminSidebar onClose={mockOnClose} />
      </MemoryRouter>
    );

    expect(screen.getByText("Back to Overview")).toBeDefined();
    expect(screen.getByText("Notifications")).toBeDefined();
    expect(screen.getByText("Notification History")).toBeDefined();
    expect(screen.getByText("Settings")).toBeDefined();
    expect(screen.getByText("Log out")).toBeDefined();
  });

  it("calls onClose when a link is clicked", () => {
    render(
      <MemoryRouter>
        <AdminSidebar onClose={mockOnClose} />
      </MemoryRouter>
    );

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      fireEvent.click(link);
      expect(mockOnClose).toHaveBeenCalled();
      vi.clearAllMocks();
    });
  });

  it("applies active classes to NavLink when active", () => {
    render(
      <MemoryRouter initialEntries={["/admin/notifications"]}>
        <AdminSidebar onClose={mockOnClose} />
      </MemoryRouter>
    );

    const activeLink = screen.getByRole("link", { name: "Notifications" });
    expect(activeLink.className).toContain("bg-cyan-50");
    expect(activeLink.className).toContain("text-cyan-700");
    expect(activeLink.className).toContain("ring-1");

    const inactiveLink = screen.getByRole("link", { name: "Notification History" });
    expect(inactiveLink.className).not.toContain("bg-cyan-50");
    expect(inactiveLink.className).toContain("text-gray-800");
  });

  it("applies logout specific classes", () => {
    render(
      <MemoryRouter>
        <AdminSidebar onClose={mockOnClose} />
      </MemoryRouter>
    );

    const logoutLink = screen.getByRole("link", { name: "Log out" });
    expect(logoutLink.className).toContain("text-red-500");
    expect(logoutLink.className).toContain("hover:bg-red-50");
  });
});
