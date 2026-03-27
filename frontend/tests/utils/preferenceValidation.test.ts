import { describe, expect, it } from "vitest";
import { validatePreference } from "@/utils/preferenceValidation";
import type { Preference } from "@/types";

const buildPreference = (overrides: Partial<Preference> = {}): Preference => ({
  id: 1,
  day_start: "08:00",
  day_end: "18:00",
  timezone: "Europe/London",
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

describe("validatePreference", () => {
  it("returns no errors for a valid preference", () => {
    expect(validatePreference(buildPreference())).toEqual({});
  });

  it("requires day start and day end when no per-day schedule exists", () => {
    const errors = validatePreference(
      buildPreference({
        day_schedule: [],
        day_start: "",
        day_end: "",
      }),
    );

    expect(errors).toEqual({
      day_start: ["Required."],
      day_end: ["Required."],
    });
  });

  it("validates max hours as a number when limits are enabled", () => {
    const errors = validatePreference(
      buildPreference({
        max_hours_study_per_day: Number.NaN,
      }),
    );

    expect(errors).toEqual({
      max_hours_study_per_day: ["Must be a number."],
    });
  });

  it("rejects max hours below zero", () => {
    const errors = validatePreference(
      buildPreference({
        max_hours_study_per_day: -1,
      }),
    );

    expect(errors).toEqual({
      max_hours_study_per_day: ["Must be at least 0."],
    });
  });

  it("rejects max hours above 24", () => {
    const errors = validatePreference(
      buildPreference({
        max_hours_study_per_day: 25,
        day_schedule: [],
      }),
    );

    expect(errors).toEqual({
      max_hours_study_per_day: ["Must be 24 or less."],
    });
  });

  it("flags invalid schedule times", () => {
    const errors = validatePreference(
      buildPreference({
        day_schedule: [{ day: 1, start: "bad", end: "18:00" }],
      }),
    );

    expect(errors).toEqual({
      day_schedule: ["All day schedules must have valid start/end times."],
    });
  });

  it("rejects max hours that exceed the available day length", () => {
    const errors = validatePreference(
      buildPreference({
        max_hours_study_per_day: 5,
        day_schedule: [{ day: 1, start: "09:00", end: "12:00" }],
      }),
    );

    expect(errors).toEqual({
      max_hours_study_per_day: ["Max task time exceeds your available day length."],
    });
  });

  it("rejects overnight schedules", () => {
    const errors = validatePreference(
      buildPreference({
        max_hours_study_per_day: 6,
        day_schedule: [{ day: 1, start: "22:00", end: "06:00" }],
      }),
    );

    expect(errors).toEqual({
      day_schedule: ["Each day must end after it starts."],
    });
  });

  it("skips max-hours validation when the limit is disabled", () => {
    const errors = validatePreference(
      buildPreference({
        limit_max_hours: false,
        max_hours_study_per_day: 30,
      }),
    );

    expect(errors).toEqual({});
  });
});
