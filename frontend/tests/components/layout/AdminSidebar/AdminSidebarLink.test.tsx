import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { AdminSidebarLink } from "@/components/layout/AdminSidebar/AdminSidebarLink";

describe("AdminSidebarLink Component", () => {
  it("renders link and handles click", () => {
    const onClose = vi.fn();
    render(
      <BrowserRouter>
        <AdminSidebarLink to="/test" label="Test" icon="home" onClose={onClose} />
      </BrowserRouter>
    );

    const link = screen.getByText("Test");
    expect(link).toBeDefined();
    expect(screen.getByText("home")).toBeDefined();

    fireEvent.click(link);
    expect(onClose).toHaveBeenCalled();
  });
});
