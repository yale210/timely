import type { Preference } from "@/types";

const VALID_LANDING_PAGES = ["dashboard", "calendar", "tasks"];
const VALID_WEEK_STARTS = ["monday", "sunday"];
const VALID_TIME_FORMATS = ["24h", "12h"];
const VALID_DRAG_SNAPS = [5, 10, 15, 20, 30, 60];

function parsePreferenceMinutes(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number.parseInt(hourRaw ?? "0", 10);
  const minute = Number.parseInt(minuteRaw ?? "0", 10);

  if (
    Number.isNaN(hour)
    || Number.isNaN(minute)
    || hour < 0
    || hour > 23
    || minute < 0
    || minute > 59
  ) {
    return null;
  }

  return (hour * 60) + minute;
}

function validatePreferenceBasics(
  preference: Preference,
  errors: Record<string, string[]>,
) {
  if (!preference.timezone) {
    errors.timezone = ["Required."];
  }

  if (!VALID_LANDING_PAGES.includes(preference.default_landing_page ?? "dashboard")) {
    errors.default_landing_page = ["Must be dashboard, calendar, or tasks."];
  }

  if (!VALID_WEEK_STARTS.includes(preference.week_starts_on ?? "monday")) {
    errors.week_starts_on = ["Must be monday or sunday."];
  }

  if (!VALID_TIME_FORMATS.includes(preference.time_format ?? "24h")) {
    errors.time_format = ["Must be 24h or 12h."];
  }
}

function validatePreferenceMaxHours(
  maxHours: number,
  limitMaxHours: boolean,
  errors: Record<string, string[]>,
) {
  if (!limitMaxHours) {
    return;
  }

  if (Number.isNaN(maxHours)) {
    errors.max_hours_study_per_day = ["Must be a number."];
    return;
  }

  if (maxHours < 0) {
    errors.max_hours_study_per_day = ["Must be at least 0."];
    return;
  }

  if (maxHours > 24) {
    errors.max_hours_study_per_day = ["Must be 24 or less."];
  }
}

function validatePreferenceMaxDaysAhead(
  maxDaysAhead: Preference["max_days_ahead"],
  errors: Record<string, string[]>,
) {
  if (maxDaysAhead == null) {
    return;
  }

  if (Number.isNaN(maxDaysAhead)) {
    errors.max_days_ahead = ["Must be a number."];
    return;
  }

  if (maxDaysAhead < 1) {
    errors.max_days_ahead = ["Must be at least 1 day."];
    return;
  }

  if (maxDaysAhead > 365) {
    errors.max_days_ahead = ["Must be 365 days or less."];
  }
}

function validateDragSnapMinutes(
  dragSnapMinutes: Preference["drag_snap_minutes"],
  errors: Record<string, string[]>,
) {
  if (dragSnapMinutes == null || VALID_DRAG_SNAPS.includes(dragSnapMinutes)) {
    return;
  }

  errors.drag_snap_minutes = ["Must be one of 5, 10, 15, 20, 30, or 60 minutes."];
}

function validatePreferenceDayBounds(
  preference: Preference,
  errors: Record<string, string[]>,
) {
  const dayStartMinutes = parsePreferenceMinutes(preference.day_start?.slice(0, 5));
  const dayEndMinutes = parsePreferenceMinutes(preference.day_end?.slice(0, 5));

  if (!preference.day_start) {
    errors.day_start = ["Required."];
  } else if (dayStartMinutes === null) {
    errors.day_start = ["Must be a valid time."];
  }

  if (!preference.day_end) {
    errors.day_end = ["Required."];
  } else if (dayEndMinutes === null) {
    errors.day_end = ["Must be a valid time."];
  } else if (dayStartMinutes !== null && dayEndMinutes <= dayStartMinutes) {
    errors.day_end = ["Day end must be after day start."];
  }
}

function validatePreferenceDaySchedule(
  preference: Preference,
  errors: Record<string, string[]>,
) {
  const maxHours = preference.max_hours_study_per_day;
  const limitMaxHours = preference.limit_max_hours ?? true;

  (preference.day_schedule ?? []).forEach((entry) => {
    const startMinutes = parsePreferenceMinutes(entry.start);
    const endMinutes = parsePreferenceMinutes(entry.end);

    if (startMinutes === null || endMinutes === null) {
      errors.day_schedule = ["All day schedules must have valid start/end times."];
      return;
    }

    if (endMinutes <= startMinutes) {
      errors.day_schedule = ["Each day must end after it starts."];
      return;
    }

    if (!limitMaxHours) {
      return;
    }

    const minutesAvailable = endMinutes - startMinutes;
    if ((maxHours * 60) > minutesAvailable) {
      errors.max_hours_study_per_day = ["Max task time exceeds your available day length."];
    }
  });
}

/**
 * Validates a user preference object and returns field-level errors.
 * @param preference - The preference values to validate.
 * @returns A record mapping field names to their validation error messages.
 */
export const validatePreference = (preference: Preference): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};
  const maxHours = preference.max_hours_study_per_day;
  const limitMaxHours = preference.limit_max_hours ?? true;

  validatePreferenceBasics(preference, errors);
  validatePreferenceMaxHours(maxHours, limitMaxHours, errors);
  validatePreferenceMaxDaysAhead(preference.max_days_ahead, errors);
  validateDragSnapMinutes(preference.drag_snap_minutes, errors);
  validatePreferenceDayBounds(preference, errors);
  validatePreferenceDaySchedule(preference, errors);

  return errors;
};
