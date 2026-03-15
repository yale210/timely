import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RecurrenceScopeModal from "@/components/modals/RecurrenceScopeModal";

describe("RecurrenceScopeModal", () => {
  it("renders scope options and disables the single-event save option when required", () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <RecurrenceScopeModal
        isOpen
        onClose={onClose}
        onSelect={onSelect}
        action="save"
        disableThisOption
      />,
    );

    expect(screen.getByRole("button", { name: "This event" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "This and following" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onSelect).toHaveBeenCalledWith("following");
    expect(onClose).toHaveBeenCalled();
  });
});
