import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AdminNotificationHistoryDetailRetryModal } from "@/pages/Admin/Notifications/AdminNotificationHistoryDetail/AdminNotificationHistoryDetailRetryModal";

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

describe("AdminNotificationHistoryDetailRetryModal", () => {
  it("renders the retry confirmation details and forwards confirm", () => {
    const onConfirm = vi.fn();

    render(
      <AdminNotificationHistoryDetailRetryModal
        isOpen={true}
        failedRecipientsCount={3}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText("Retry failed recipients?")).toBeDefined();
    expect(screen.getByText("This will re-send to 3 failed recipients only.")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Retry failed" }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
