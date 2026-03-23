import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminUserRoleBadge } from "@/components/admin/AdminUserTable/AdminUserRoleBadge";

describe("AdminUserRoleBadge Component", () => {
  it("renders Admin for superusers", () => {
    render(<AdminUserRoleBadge isSuperuser={true} isStaff={true} />);
    expect(screen.getByText("Admin")).toBeDefined();
  });

  it("renders Staff for staff users", () => {
    render(<AdminUserRoleBadge isSuperuser={false} isStaff={true} />);
    expect(screen.getByText("Staff")).toBeDefined();
  });

  it("renders User for normal users", () => {
    render(<AdminUserRoleBadge isSuperuser={false} isStaff={false} />);
    expect(screen.getByText("User")).toBeDefined();
  });
});
