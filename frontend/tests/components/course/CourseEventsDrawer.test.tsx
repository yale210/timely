import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CourseEventsDrawer from "@/components/course/CourseEventsDrawer";

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

describe("CourseEventsDrawer", () => {
  const onClose = vi.fn();

  it("renders the drawer header and loading state", () => {
    render(
      <CourseEventsDrawer
        courseName="Python Basics"
        events={[]}
        loading={true}
        onClose={onClose}
      />
    );

    expect(screen.getByRole("heading", { name: "Python Basics" })).toBeTruthy();
    expect(screen.getByText("Course events calendar")).toBeTruthy();
    expect(screen.getByText("Loading events...")).toBeTruthy();
    expect(screen.queryByTestId("calendar-mock")).toBeNull();
  });

  it("renders the calendar when not loading", () => {
    render(
      <CourseEventsDrawer
        courseName="Python Basics"
        loading={false}
        onClose={onClose}
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
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
  });

  it("calls onClose from the backdrop and close button", () => {
    render(
      <CourseEventsDrawer
        courseName="Python Basics"
        loading={false}
        onClose={onClose}
        events={[]}
      />
    );

    fireEvent.click(screen.getByLabelText("Close course drawer backdrop"));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});