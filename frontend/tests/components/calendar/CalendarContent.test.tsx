import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CalendarContent from "@/components/calendar/CalendarContent";

vi.mock("@/components/calendar/CalendarToolbar", () => ({
  default: ({
    headerRef,
    calendarHeaderTopClass,
  }: {
    headerRef: { current: HTMLElement | null };
    calendarHeaderTopClass: string;
  }) => (
    <div
      ref={(node) => {
        headerRef.current = node;
      }}
      data-testid="calendar-toolbar"
    >
      {calendarHeaderTopClass}
    </div>
  ),
}));

vi.mock("@/components/calendar/CalendarView", () => ({
  default: () => <div data-testid="calendar-view" />,
}));

vi.mock("@/components/calendar/CalendarSidebar", () => ({
  default: () => <div data-testid="calendar-sidebar" />,
}));

class ResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
  ResizeObserver;

describe("CalendarContent", () => {
  it("renders the calendar shell and measures the toolbar height", async () => {
    const actions = {
      setHeaderHeight: vi.fn(),
      setView: vi.fn(),
      goToToday: vi.fn(),
      goToPrevious: vi.fn(),
      goToNext: vi.fn(),
      rescheduleTasks: vi.fn(),
      setDate: vi.fn(),
      selectSlot: vi.fn(),
      selectEntry: vi.fn(),
      handleEventDrop: vi.fn(),
      handleEventResize: vi.fn(),
      handleToggleTaskComplete: vi.fn(),
      setTimeGutterWidth: vi.fn(),
      closeSidebar: vi.fn(),
      submitTask: vi.fn(),
      submitEvent: vi.fn(),
      deleteSelected: vi.fn(),
      revertSelectedEvent: vi.fn(),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
      updateTaskCategories: vi.fn(),
    };

    render(
      <CalendarContent
        state={{
          view: "week",
          date: new Date(),
          currentLabel: "March 2026",
          dateStripDays: [],
          timeGutterWidth: 60,
          isRescheduling: false,
          calendarEntries: [],
          preference: null,
          headerHeight: 0,
          isSidebarOpen: false,
          categories: [],
          selectedItem: null,
          sidebarMode: "task",
        } as never}
        actions={actions as never}
        showNavbar
        useLayout
      />,
    );

    expect(screen.getByTestId("calendar-toolbar")).toHaveTextContent("top-10");
    expect(screen.getByTestId("calendar-view")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-sidebar")).toBeInTheDocument();

    await waitFor(() => expect(actions.setHeaderHeight).toHaveBeenCalled());
  });
});
