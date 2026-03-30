import { describe, expectTypeOf, it } from "vitest";
import type { PomoSession } from "@/types/pomo";

describe("pomo types", () => {
  it("defines the pomodoro session shape", () => {
    const session = {
      id: 1,
      duration_minutes: 25,
      completed_at: "2026-03-30T09:00:00Z",
      created_at: "2026-03-30T08:30:00Z",
    } satisfies PomoSession;

    expectTypeOf(session).toMatchTypeOf<PomoSession>();
  });
});
