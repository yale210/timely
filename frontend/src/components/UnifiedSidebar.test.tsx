import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import UnifiedSidebar from "./UnifiedSidebar";
import { type Category } from "../types";

const mockCategories: Category[] = [
  { id: 1, text: "Work" },
  { id: 2, text: "Personal" },
];

describe("UnifiedSidebar", () => {
  afterEach(() => {
    cleanup();
  });

  it("preserves shared fields when switching from Task to Event mode", () => {
    const onSubmitTask = vi.fn();
    const onSubmitEvent = vi.fn();
    const onClose = vi.fn();

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={onClose}
        categories={mockCategories}
        onSubmitTask={onSubmitTask}
        onSubmitEvent={onSubmitEvent}
      />
    );

    // Start in Task mode
    const titleInput = screen.getByLabelText(/Title/i) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "Shared Title" } });
    
    const descInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    fireEvent.change(descInput, { target: { value: "Shared Description" } });

    // Switch to Event mode
    const eventButton = screen.getByTestId("mode-toggle-event");
    fireEvent.click(eventButton);

    // Check if fields are preserved
    expect((screen.getByLabelText(/Title/i) as HTMLInputElement).value).toBe("Shared Title");
    expect((screen.getByLabelText(/Description/i) as HTMLTextAreaElement).value).toBe("Shared Description");
  });

  it("preserves shared fields when switching from Event to Task mode", () => {
    const onSubmitTask = vi.fn();
    const onSubmitEvent = vi.fn();
    const onClose = vi.fn();

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={onClose}
        initialMode="event"
        categories={mockCategories}
        onSubmitTask={onSubmitTask}
        onSubmitEvent={onSubmitEvent}
      />
    );

    // Start in Event mode
    const titleInput = screen.getByLabelText(/Title/i) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "Event Title" } });

    // Switch to Task mode
    const taskButton = screen.getByTestId("mode-toggle-task");
    fireEvent.click(taskButton);

    // Check if fields are preserved
    expect((screen.getByLabelText(/Title/i) as HTMLInputElement).value).toBe("Event Title");
  });
});
