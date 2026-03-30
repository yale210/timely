import { describe, expectTypeOf, it } from "vitest";
import type { ExportResponse, ScheduleResponse, ScheduleResult } from "@/types/schedule";

describe("schedule types", () => {
  it("defines an individual scheduling result", () => {
    const result = {
      task_id: 1,
      success: true,
      scheduled_start: "2026-03-30T09:00:00Z",
      scheduled_end: "2026-03-30T10:00:00Z",
      reason: null,
    } satisfies ScheduleResult;

    expectTypeOf(result).toMatchTypeOf<ScheduleResult>();
  });

  it("defines the scheduling response shape", () => {
    const response = {
      start_date: "2026-03-30",
      scheduled_count: 1,
      failed_count: 0,
      results: [{
        task_id: 1,
        success: true,
        scheduled_start: "2026-03-30T09:00:00Z",
        scheduled_end: "2026-03-30T10:00:00Z",
        reason: null,
      }],
    } satisfies ScheduleResponse;

    expectTypeOf(response).toMatchTypeOf<ScheduleResponse>();
  });

  it("defines the export response shape", () => {
    const response = {
      file_name: "events.ics",
      content_type: "text/calendar",
      data: "BEGIN:VCALENDAR",
    } satisfies ExportResponse;

    expectTypeOf(response).toMatchTypeOf<ExportResponse>();
  });
});
