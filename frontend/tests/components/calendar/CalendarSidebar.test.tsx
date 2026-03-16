import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CalendarSidebar from "@/components/calendar/CalendarSidebar";

vi.mock("@/components", () => ({
  UnifiedSidebar: (props: {
    isOpen: boolean;
    initialMode: string;
    onClose: () => void;
    onTaskCategoryChange: (id: number, categories: number[]) => void;
    onSubmitTask: (data: { title: string }) => void;
    onSubmitEvent: (data: { title: string }) => void;
    onDelete: () => void;
    onRevertToSeries: () => void;
  }) => (
    <div data-testid="unified-sidebar">
      <span>{props.isOpen ? "open" : "closed"}</span>
      <span>{props.initialMode}</span>
      <button type="button" onClick={props.onClose}>
        close
      </button>
      <button type="button" onClick={() => props.onTaskCategoryChange(1, [2])}>
        categories
      </button>
      <button type="button" onClick={() => props.onSubmitTask({ title: "Task" })}>
        submit-task
      </button>
      <button type="button" onClick={() => props.onSubmitEvent({ title: "Event" })}>
        submit-event
      </button>
      <button type="button" onClick={() => props.onDelete()}>
        delete
      </button>
      <button type="button" onClick={() => props.onRevertToSeries()}>
        revert
      </button>
    </div>
  ),
}));

describe("CalendarSidebar", () => {
  it("forwards sidebar state and actions to UnifiedSidebar", () => {
    const actions = {
      closeSidebar: vi.fn(),
      submitTask: vi.fn(),
      submitEvent: vi.fn(),
      deleteSelected: vi.fn(),
      revertSelectedEvent: vi.fn(),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
      updateTaskCategories: vi.fn().mockResolvedValue(undefined),
    };

    render(
      <CalendarSidebar
        state={{
          isSidebarOpen: true,
          categories: [],
          selectedItem: undefined,
          sidebarMode: "event",
        }}
        actions={actions}
      />,
    );

    expect(screen.getByTestId("unified-sidebar")).toHaveTextContent("open");
    expect(screen.getByTestId("unified-sidebar")).toHaveTextContent("event");

    fireEvent.click(screen.getByRole("button", { name: "close" }));
    fireEvent.click(screen.getByRole("button", { name: "categories" }));
    fireEvent.click(screen.getByRole("button", { name: "submit-task" }));
    fireEvent.click(screen.getByRole("button", { name: "submit-event" }));
    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    fireEvent.click(screen.getByRole("button", { name: "revert" }));

    expect(actions.closeSidebar).toHaveBeenCalled();
    expect(actions.updateTaskCategories).toHaveBeenCalledWith(1, [2]);
    expect(actions.submitTask).toHaveBeenCalledWith({ title: "Task" });
    expect(actions.submitEvent).toHaveBeenCalledWith({ title: "Event" }, undefined);
    expect(actions.deleteSelected).toHaveBeenCalledWith(undefined);
    expect(actions.revertSelectedEvent).toHaveBeenCalledWith(undefined);
  });
});
