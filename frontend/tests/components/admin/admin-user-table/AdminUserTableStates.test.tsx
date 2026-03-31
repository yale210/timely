import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminUserTableStates } from "@/components/admin/admin-user-table/AdminUserTableStates";

describe("AdminUserTableStates Component", () => {
  it("renders loading state", () => {
    render(
      <table>
        <AdminUserTableStates isLoading={true} error={null} isEmpty={false} />
      </table>
    );
    expect(screen.getByText("Loading users...")).toBeDefined();
  });

  it("renders error state", () => {
    render(
      <table>
        <AdminUserTableStates isLoading={false} error="Fail" isEmpty={false} />
      </table>
    );
    expect(screen.getByText("Fail")).toBeDefined();
  });

  it("renders empty state", () => {
    render(
      <table>
        <AdminUserTableStates isLoading={false} error={null} isEmpty={true} />
      </table>
    );
    expect(screen.getByText("No users match your search.")).toBeDefined();
  });

  it("renders null when no special state", () => {
    const { container } = render(
      <table>
        <AdminUserTableStates isLoading={false} error={null} isEmpty={false} />
      </table>
    );
    expect(container.querySelector("tbody")).toBeNull();
  });
});
