import { describe, expect, it } from "vitest";
import { buildCalendarEntries } from "@/utils/calendarAdapter";
import type { Event, Task } from "@/types";

describe("buildCalendarEntries", () => {
  it("maps allocated tasks and events into calendar entries", () => {
    const tasks: Task[] = [
      {
        id: 1,
        title: "Allocated Task",
        start_time: "2026-02-12T09:00:00.000Z",
        deadline: "2026-02-12T11:00:00.000Z",
        importance: 5,
        completed: false,
        categories: [],
        estimated_minutes: 120,
        allocation: [
          {
            start: "2026-02-12T09:00:00.000Z",
            end: "2026-02-12T11:00:00.000Z",
          },
        ],
      },
      {
        id: 2,
        title: "Unscheduled Task",
        start_time: "2026-02-13T09:00:00.000Z",
        deadline: "2026-02-13T11:00:00.000Z",
        importance: 4,
        completed: false,
        categories: [],
        estimated_minutes: 90,
      },
    ];
    const events: Event[] = [
      {
        id: 3,
        title: "Calendar Event",
        start_time: "2026-02-12T12:00:00.000Z",
        end_time: "2026-02-12T13:00:00.000Z",
        categories: [],
        reminders: [],
        instance_id: "event-3-instance",
      },
    ];

    const entries = buildCalendarEntries({
      tasks,
      events,
      scheduleOrder: { 1: 0 },
    });

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      id: "task-1-0",
      title: "Allocated Task",
      kind: "task",
      sourceId: 1,
      oneGo: true,
      scheduleIndex: 0,
    });
    expect(entries[1]).toMatchObject({
      id: "event-3-instance",
      title: "Calendar Event",
      kind: "event",
      sourceId: 3,
      oneGo: true,
    });
  });

  it("marks long allocations as all-day and split allocations as split", () => {
    const entries = buildCalendarEntries({
      tasks: [
        {
          id: 9,
          title: "Long Task",
          start_time: "2026-02-12T09:00:00.000Z",
          deadline: "2026-02-14T10:00:00.000Z",
          importance: 8,
          completed: false,
          categories: [],
          estimated_minutes: 180,
          allocation: [
            {
              start: "2026-02-12T09:00:00.000Z",
              end: "2026-02-13T11:00:00.000Z",
            },
            {
              start: "2026-02-13T12:00:00.000Z",
              end: "2026-02-13T13:00:00.000Z",
            },
          ],
        },
      ],
      events: [],
      scheduleOrder: {},
    });

    expect(entries).toHaveLength(2);
    expect(entries[0].allDay).toBe(true);
    expect(entries[0].split).toBe(true);
    expect(entries[1].split).toBe(true);
  });
});

