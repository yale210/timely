import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import ScopeActionModal from "@/components/modals/ScopeActionModal";

describe("ScopeActionModal", () => {
  it("shows correct labels for save + following and calls onConfirm", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ScopeActionModal isOpen={true} action="save" scope="following" onClose={onClose} onConfirm={onConfirm} />,
    );

    expect(screen.getByText(/Apply changes to this and following events/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Apply to Following Events/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Apply to Following Events/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("shows correct labels for delete + all and calls onConfirm", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ScopeActionModal isOpen={true} action="delete" scope={null} onClose={onClose} onConfirm={onConfirm} />,
    );

    expect(screen.getByText(/Delete all events in this series/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete All Events/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Delete All Events/i }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
