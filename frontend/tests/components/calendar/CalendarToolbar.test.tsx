import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import moment from "moment";
import { Views } from "react-big-calendar";
import { describe, expect, it, vi } from "vitest";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";

describe("CalendarToolbar", () => {
  it("renders navigation controls, date strip, and forwards actions", () => {
    const actions = {
      setView: vi.fn(),
      goToToday: vi.fn(),
      goToPrevious: vi.fn(),
      goToNext: vi.fn(),
      openCreateSidebar: vi.fn(),
      rescheduleTasks: vi.fn(),
    };

    render(
      <CalendarToolbar
        headerRef={createRef<HTMLElement>()}
        calendarHeaderTopClass="top-10"
        state={{
          view: Views.WEEK,
          date: new Date("2026-03-15T00:00:00.000Z"),
          currentLabel: "March 2026",
          dateStripDays: [moment("2026-03-15"), moment("2026-03-16")],
          timeGutterWidth: 60,
          isRescheduling: false,
          rescheduleWarnings: [],
          preference: null,
        }}
        actions={actions}
      />,
    );

    expect(screen.getByRole("heading", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "March 2026" })).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    fireEvent.click(screen.getByRole("button", { name: "Month" }));
    fireEvent.click(screen.getByRole("button", { name: "Add task or event" }));
    fireEvent.click(screen.getByRole("button", { name: /reschedule/i }));
    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.click(screen.getAllByRole("button")[2]);

    expect(actions.goToToday).toHaveBeenCalled();
    expect(actions.setView).toHaveBeenCalledWith(Views.MONTH);
    expect(actions.openCreateSidebar).toHaveBeenCalled();
    expect(actions.rescheduleTasks).toHaveBeenCalled();
    expect(actions.goToPrevious).toHaveBeenCalled();
    expect(actions.goToNext).toHaveBeenCalled();

    



  });
});
