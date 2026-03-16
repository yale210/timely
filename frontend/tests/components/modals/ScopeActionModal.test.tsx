import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ScopeActionModal from "@/components/modals/ScopeActionModal";

describe("ScopeActionModal", () => {
  it("renders the correct copy for delete-all and confirms", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ScopeActionModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        action="delete"
        scope="all"
      />,
    );

    expect(screen.getByText("Delete all events in this series?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete All Events" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
