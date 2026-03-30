import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminBroadcastFormTarget } from "@/components/admin/notifications/AdminBroadcastForm";
import { type AdminNotificationTarget } from "@/types";

describe("AdminBroadcastFormTarget Component", () => {
  const defaultProps = {
    target: "all" as AdminNotificationTarget,
    targetAudienceCount: 15,
    audienceCounts: { all: 15, staff: 5, admin: 2, selected_users: 0 },
    targetOptions: [
      { label: "All users", value: "all" as AdminNotificationTarget },
      { label: "Staff", value: "staff" as AdminNotificationTarget },
    ],
    isSubmitting: false,
    onTargetChange: vi.fn(),
  };

  it("renders with options and estimated count", () => {
    render(<AdminBroadcastFormTarget {...defaultProps} />);

    expect(screen.getByLabelText("Target audience")).toHaveValue("all");
    expect(screen.getByText("Estimated recipients: 15")).toBeDefined();
    expect(screen.getByText("All users (15)")).toBeDefined();
  });

  it("calls onTargetChange when selection changes", () => {
    const onTargetChange = vi.fn();
    render(<AdminBroadcastFormTarget {...defaultProps} onTargetChange={onTargetChange} />);

    fireEvent.change(screen.getByLabelText("Target audience"), { target: { value: "staff" } });
    expect(onTargetChange).toHaveBeenCalledWith("staff");
  });
});
