import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MiniCalendarPreview from "@/components/dashboard/MiniCalendarPreview";
import { preferenceService } from "@/services/preferenceService";
import type { Event, Task } from "@/types";

vi.mock("@/services/preferenceService", () => ({
  preferenceService: {
    getMyPreference: vi.fn(),
  },
}));

vi.mock("react-big-calendar", () => ({
  Views: { WEEK: "week" },
  momentLocalizer: () => ({}),
  Calendar: ({ events }: { events: unknown[] }) => (
    <div data-testid="mini-calendar">events:{events.length}</div>
  ),
}));

class ResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
  ResizeObserver;

const tasks: Task[] = [
  {
    id: 1,
    title: "Essay",
    start_time: "2026-03-15T09:00:00.000Z",
    deadline: "2026-03-15T11:00:00.000Z",
    importance: 6,
    completed: false,
    categories: [],
    estimated_minutes: 60,
    allocation: [
      {
        start: "2026-03-15T09:00:00.000Z",
        end: "2026-03-15T10:00:00.000Z",
      },
    ],
  },
];

const events: Event[] = [
  {
    id: 1,
    title: "Seminar",
    start_time: "2026-03-15T13:00:00.000Z",
    end_time: "2026-03-15T14:00:00.000Z",
    categories: [],
    reminders: [],
  },
];

describe("MiniCalendarPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads preferences and passes combined entries to the mini calendar", async () => {
    vi.mocked(preferenceService.getMyPreference).mockResolvedValue({
      id: 1,
      day_start: "08:00:00",
      day_end: "22:00:00",
      max_hours_study_per_day: 4,
      days_off: [],
      day_schedule: [],
    } as never);

    render(<MiniCalendarPreview tasks={tasks} events={events} />);

    await waitFor(() => expect(preferenceService.getMyPreference).toHaveBeenCalled());
    expect(screen.getByTestId("mini-calendar")).toHaveTextContent("events:2");
  });
});
