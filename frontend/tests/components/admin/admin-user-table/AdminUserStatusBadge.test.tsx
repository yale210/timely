import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminUserStatusBadge } from "@/components/admin/admin-user-table/AdminUserBadges";

describe("AdminUserStatusBadge Component", () => {
  it("renders Active when isActive is true", () => {
    render(<AdminUserStatusBadge isActive={true} />);
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByText("Active").className).toContain("bg-emerald-50");
  });

  it("renders Inactive when isActive is false", () => {
    render(<AdminUserStatusBadge isActive={false} />);
    expect(screen.getByText("Inactive")).toBeDefined();
    expect(screen.getByText("Inactive").className).toContain("bg-gray-100");
  });
});
