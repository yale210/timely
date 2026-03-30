import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AdminNotificationsConfirmModal } from "@/components/admin/notifications";

vi.mock("@/components/modals/ConfirmationModal", () => ({
  default: ({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    onConfirm,
  }: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }) => (
    isOpen ? (
      <div>
        <h1>{title}</h1>
        <p>{message}</p>
        <button type="button" onClick={onConfirm}>{confirmText}</button>
      </div>
    ) : null
  ),
}));

describe("AdminNotificationsConfirmModal", () => {
  it("renders the audience count and forwards confirm", () => {
    const onConfirm = vi.fn();

    render(
      <AdminNotificationsConfirmModal
        isOpen={true}
        targetAudienceCount={12}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText("Send this broadcast?")).toBeDefined();
    expect(screen.getByText("You are about to notify 12 recipients.")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Send now" }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
