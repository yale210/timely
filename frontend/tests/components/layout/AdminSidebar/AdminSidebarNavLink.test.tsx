import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AdminSidebarNavLink } from "@/components/layout/AdminSidebar/AdminSidebarNavLink";

describe("AdminSidebarNavLink Component", () => {
  it("renders nav link and handles click", () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter initialEntries={["/active"]}>
        <AdminSidebarNavLink to="/active" label="Active" icon="star" onClose={onClose} />
        <AdminSidebarNavLink to="/inactive" label="Inactive" icon="circle" onClose={onClose} />
      </MemoryRouter>
    );

    const activeLink = screen.getByText("Active").closest("a");
    expect(activeLink?.className).toContain("bg-cyan-50");

    const inactiveLink = screen.getByText("Inactive").closest("a");
    expect(inactiveLink?.className).not.toContain("bg-cyan-50");

    fireEvent.click(screen.getByText("Active"));
    expect(onClose).toHaveBeenCalled();
  });
});
