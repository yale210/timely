import { describe, expect, it } from "vitest";
import {
  buildRecurrenceContext,
  buildRevertContext,
  hasRecurrencePatternChangedForEvent,
} from "@/hooks/tasks/useRecurrenceScopeActions";
import type { Event, EventSubmission } from "@/types";

describe("useRecurrenceScopeActions helpers", () => {
  const event = {
    id: 1,
    recurrence_interval: "daily",
    recurrence_end: "2024-01-10",
    start_time: "2024-01-01T10:00:00Z",
    original_start_time: "2024-01-01T09:00:00Z",
  } as unknown as Event;

  it("builds scoped context from the original start time when available", () => {
    expect(buildRecurrenceContext(event, "following")).toEqual({
      scope: "following",
      original_start_time: "2024-01-01T09:00:00Z",
    });
  });

  it("returns a revert context only when an anchor exists", () => {
    expect(buildRevertContext(event)).toEqual({
      scope: "this",
      original_start_time: "2024-01-01T09:00:00Z",
    });
    expect(buildRevertContext({ id: 2 } as Event)).toBeUndefined();
  });

  it("detects recurrence pattern changes against the selected event", () => {
    expect(
      hasRecurrencePatternChangedForEvent(event, {
        recurrence_interval: "daily",
      } as EventSubmission),
    ).toBe(false);
    expect(
      hasRecurrencePatternChangedForEvent(event, {
        recurrence_interval: "weekly",
      } as EventSubmission),
    ).toBe(true);
  });
});
