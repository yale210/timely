import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CourseEventsCalendar from "@/components/course/CourseEventsCalendar";

vi.mock("react-big-calendar", () => ({
  Calendar: ({ events }: { events: { title: string }[] }) => (
    <div data-testid="calendar-mock">
      {events.map((event) => (
        <span key={event.title}>{event.title}</span>
      ))}
    </div>
  ),
  momentLocalizer: () => vi.fn(),
  Views: {
    MONTH: "month",
    WEEK: "week",
    DAY: "day",
  },
}));

describe("CourseEventsCalendar", () => {
  it("renders the empty inline state when there are no events", () => {
    render(<CourseEventsCalendar courseName="Python Basics" events={[]} inline />);

    expect(screen.getByRole("heading", { name: "Python Basics" })).toBeTruthy();
    expect(screen.getByText("Course events calendar")).toBeTruthy();
    expect(screen.getByText("No events yet")).toBeTruthy();
    expect(
      screen.getByText("This course doesn't have any scheduled events yet.")
    ).toBeTruthy();
    expect(screen.queryByTestId("calendar-mock")).toBeNull();
  });

  it("renders the calendar when events exist", () => {
    render(
      <CourseEventsCalendar
        courseName="Python Basics"
        inline
        events={[
          {
            id: 1,
            title: "Intro lesson",
            description: "",
            location: "",
            start_time: "2026-01-01T10:00:00Z",
            end_time: "2026-01-01T11:00:00Z",
          } as never,
        ]}
      />
    );

    expect(screen.getByTestId("calendar-mock")).toBeTruthy();
    expect(screen.getByText("Intro lesson")).toBeTruthy();
    expect(screen.queryByText("No events yet")).toBeNull();
  });

  it("shows a close button in modal mode when onClose is provided", () => {
    const onClose = vi.fn();

    render(
      <CourseEventsCalendar
        courseName="Python Basics"
        events={[]}
        onClose={onClose}
        inline={false}
      />
    );

    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
  });
});