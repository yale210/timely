import { describe, expect, it } from "vitest";
import type { Preference } from "@/types";
import { getSchedulingDayMaxMinutes } from "@/utils/schedulingLimits";

const buildPreference = (overrides: Partial<Preference> = {}): Preference => ({
  id: 1,
  day_start: "08:00",
  day_end: "18:00",
  day_schedule: [
    { day: 1, start: "08:00", end: "18:00" },
    { day: 2, start: "08:00", end: "18:00" },
  ],
  max_hours_study_per_day: 8,
  max_days_ahead: 7,
  drag_snap_minutes: 15,
  limit_max_hours: true,
  disable_sound_effects: false,
  days_off: [],
  ...overrides,
});

describe("getSchedulingDayMaxMinutes", () => {
  it("returns a full day when there is no preference", () => {
    expect(getSchedulingDayMaxMinutes(null)).toBe(24 * 60);
  });

  it("uses the smaller of schedule length and configured limit when limits are enabled", () => {
    const preference = buildPreference({
      day_schedule: [{ day: 1, start: "08:00", end: "14:00" }],
      max_hours_study_per_day: 8,
      limit_max_hours: true,
    });

    expect(getSchedulingDayMaxMinutes(preference)).toBe(6 * 60);
  });

  it("uses the raw schedule maximum when the max-hours limit is disabled", () => {
    const preference = buildPreference({
      day_schedule: [
        { day: 1, start: "08:00", end: "14:00" },
        { day: 2, start: "09:00", end: "19:00" },
      ],
      max_hours_study_per_day: 2,
      limit_max_hours: false,
    });

    expect(getSchedulingDayMaxMinutes(preference)).toBe(10 * 60);
  });

  it("falls back to day_start and day_end when no per-day schedule exists", () => {
    const preference = buildPreference({
      day_schedule: [],
      day_start: "07:30",
      day_end: "16:00",
      max_hours_study_per_day: 20,
    });

    expect(getSchedulingDayMaxMinutes(preference)).toBe(8.5 * 60);
  });

  it("handles overnight schedules correctly", () => {
    const preference = buildPreference({
      day_schedule: [{ day: 1, start: "22:00", end: "06:00" }],
      max_hours_study_per_day: 9,
      limit_max_hours: true,
    });

    expect(getSchedulingDayMaxMinutes(preference)).toBe(8 * 60);
  });

  it("ignores invalid schedule rows when determining the maximum", () => {
    const preference = buildPreference({
      day_schedule: [
        { day: 1, start: "bad", end: "11:00" },
        { day: 2, start: "10:00", end: "12:30" },
      ],
      max_hours_study_per_day: 10,
      limit_max_hours: false,
    });

    expect(getSchedulingDayMaxMinutes(preference)).toBe(150);
  });
});
