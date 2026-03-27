import type { Preference } from "@/types";

/**
 * Validates a user preference object and returns field-level errors.
 * @param preference - The preference values to validate.
 * @returns A record mapping field names to their validation error messages.
 */
export const validatePreference = (preference: Preference): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};
  const max = preference.max_hours_study_per_day;
  const limitMax = preference.limit_max_hours ?? true;
  const parseMinutes = (value: string | undefined) => {
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
  };

  if (!preference.timezone) {
    errors.timezone = ["Required."];
  }

  if (limitMax && Number.isNaN(max)) {
    errors.max_hours_study_per_day = ["Must be a number."];
  } else if (limitMax && max < 0) {
    errors.max_hours_study_per_day = ["Must be at least 0."];
  } else if (limitMax && max > 24) {
    errors.max_hours_study_per_day = ["Must be 24 or less."];
  }

  if (preference.max_days_ahead != null && Number.isNaN(preference.max_days_ahead)) {
    errors.max_days_ahead = ["Must be a number."];
  } else if (preference.max_days_ahead != null && preference.max_days_ahead < 1) {
    errors.max_days_ahead = ["Must be at least 1 day."];
  } else if (preference.max_days_ahead != null && preference.max_days_ahead > 365) {
    errors.max_days_ahead = ["Must be 365 days or less."];
  }

  if (
    preference.drag_snap_minutes != null
    && ![5, 10, 15, 20, 30, 60].includes(preference.drag_snap_minutes)
  ) {
    errors.drag_snap_minutes = ["Must be one of 5, 10, 15, 20, 30, or 60 minutes."];
  }

  const dayStartMinutes = parseMinutes(preference.day_start?.slice(0, 5));
  const dayEndMinutes = parseMinutes(preference.day_end?.slice(0, 5));
  const schedule = preference.day_schedule ?? [];
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

  if (schedule.length > 0) {
    schedule.forEach((entry) => {
      const startMinutes = parseMinutes(entry.start);
      const endMinutes = parseMinutes(entry.end);
      if (startMinutes === null || endMinutes === null) {
        errors.day_schedule = ["All day schedules must have valid start/end times."];
        return;
      }
      if (endMinutes <= startMinutes) {
        errors.day_schedule = ["Each day must end after it starts."];
        return;
      }
      const minutesAvailable = endMinutes - startMinutes;
      if (limitMax && max * 60 > minutesAvailable) {
        errors.max_hours_study_per_day = [
          "Max task time exceeds your available day length.",
        ];
      }
    });
  }

  return errors;
};
