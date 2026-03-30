import { describe, expectTypeOf, it } from "vitest";
import type { Preference, PreferenceUpdate } from "@/types/preference";

describe("preference types", () => {
  it("defines the stored preference shape", () => {
    const preference = {
      id: 1,
      day_start: "08:00",
      day_end: "22:00",
      day_schedule: [{ day: 1, start: "09:00", end: "17:00" }],
      timezone: "Europe/London",
      max_hours_study_per_day: 6,
      max_days_ahead: 14,
      drag_snap_minutes: 15,
      limit_max_hours: true,
      disable_sound_effects: false,
      default_landing_page: "calendar",
      week_starts_on: "monday",
      time_format: "24h",
      days_off: [0, 6],
    } satisfies Preference;

    expectTypeOf(preference).toMatchTypeOf<Preference>();
  });

  it("allows partial preference updates", () => {
    const update = {
      day_start: "09:00",
      drag_snap_minutes: 30,
      days_off: [6],
    } satisfies PreferenceUpdate;

    expectTypeOf(update).toMatchTypeOf<PreferenceUpdate>();
  });
});
