import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminBroadcastFormConfirmation } from "@/components/admin/notifications/AdminBroadcastForm/AdminBroadcastFormConfirmation";

describe("AdminBroadcastFormConfirmation Component", () => {
  const defaultProps = {
    confirmationChecked: false,
    isSubmitting: false,
    error: null,
    onConfirmationChange: vi.fn(),
  };

  it("renders checkbox and handles change", () => {
    const onConfirmationChange = vi.fn();
    render(<AdminBroadcastFormConfirmation {...defaultProps} onConfirmationChange={onConfirmationChange} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(onConfirmationChange).toHaveBeenCalledWith(true);
  });

  it("shows error when provided", () => {
    render(<AdminBroadcastFormConfirmation {...defaultProps} error="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeDefined();
  });
});
