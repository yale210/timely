import { describe, expectTypeOf, it } from "vitest";
import type { Event, EventReminder, EventSubmission } from "@/types/event";

describe("event types", () => {
  it("defines the event reminder shape", () => {
    const reminder = {
      id: 1,
      send_push: false,
      minutes_before: 15,
    } satisfies EventReminder;

    expectTypeOf(reminder).toMatchTypeOf<EventReminder>();
  });

  it("defines the event shape", () => {
    const event = {
      id: 1,
      title: "Lecture",
      description: "Weekly lecture",
      location: "Room 101",
      start_time: "2026-03-30T09:00:00Z",
      end_time: "2026-03-30T10:00:00Z",
      colour: "#3b82f6",
      categories: [{ id: 1, text: "Study" }],
      recurrence_interval: "weekly",
      recurrence_end: "2026-06-30T10:00:00Z",
      reminders: [{ send_push: true, minutes_before: 15 }],
      is_override: false,
      is_split_series: false,
      source_event_id: 10,
      split_from_event_id: null,
      original_start_time: null,
      instance_id: "evt-1",
    } satisfies Event;

    expectTypeOf(event).toMatchTypeOf<Event>();
  });

  it("defines the event submission shape", () => {
    const submission = {
      title: "Lecture",
      categories: [1, 2],
      reminders: [{ send_push: true, minutes_before: 15 }],
    } satisfies EventSubmission;

    expectTypeOf(submission).toMatchTypeOf<EventSubmission>();
  });
});
