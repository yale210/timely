import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminBroadcastFormActions } from "@/components/admin/notifications/AdminBroadcastForm";

describe("AdminBroadcastFormActions Component", () => {
  it("renders button correctly", () => {
    render(<AdminBroadcastFormActions canSubmit={true} isSubmitting={false} />);
    expect(screen.getByRole("button", { name: "Send notification" })).not.toBeDisabled();
  });

  it("shows sending state", () => {
    render(<AdminBroadcastFormActions canSubmit={true} isSubmitting={true} />);
    expect(screen.getByText("Sending...")).toBeDefined();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when cannot submit", () => {
    render(<AdminBroadcastFormActions canSubmit={false} isSubmitting={false} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
