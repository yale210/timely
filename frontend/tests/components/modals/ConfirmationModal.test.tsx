import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConfirmationModal from "@/components/modals/ConfirmationModal";

describe("ConfirmationModal", () => {
  it("renders and handles confirm and cancel actions", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmationModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete task?"
        message="This cannot be undone."
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
