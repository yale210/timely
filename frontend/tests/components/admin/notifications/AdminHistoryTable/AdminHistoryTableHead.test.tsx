import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { AdminHistoryTableHead } from "@/components/admin/notifications/AdminHistoryTable/AdminHistoryTableHead";

describe("AdminHistoryTableHead", () => {
  it("renders the expected broadcast history columns", () => {
    render(
      <table>
        <AdminHistoryTableHead />
      </table>,
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Audience")).toBeInTheDocument();
    expect(screen.getByText("Sender")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Queued")).toBeInTheDocument();
  });
});
