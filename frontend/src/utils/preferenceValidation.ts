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

  if (limitMax && Number.isNaN(max)) {
    errors.max_hours_study_per_day = ["Must be a number."];
  } else if (limitMax && max < 0) {
    errors.max_hours_study_per_day = ["Must be at least 0."];
  } else if (limitMax && max > 24) {
    errors.max_hours_study_per_day = ["Must be 24 or less."];
  }

  const schedule = preference.day_schedule ?? [];
  if (schedule.length === 0) {
    if (!preference.day_start) {
      errors.day_start = ["Required."];
    }
    if (!preference.day_end) {
      errors.day_end = ["Required."];
    }
  } else {
    const parseMinutes = (value: string) => {
      const [hourRaw, minuteRaw] = value.split(":");
      const hour = Number.parseInt(hourRaw ?? "0", 10);
      const minute = Number.parseInt(minuteRaw ?? "0", 10);
      if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return null;
      }
      return (hour * 60) + minute;
    };
    schedule.forEach((entry) => {
      const startMinutes = parseMinutes(entry.start);
      const endMinutes = parseMinutes(entry.end);
      if (startMinutes === null || endMinutes === null) {
        errors.day_schedule = ["All day schedules must have valid start/end times."];
        return;
      }
      const diff = (endMinutes - startMinutes + (24 * 60)) % (24 * 60);
      const minutesAvailable = diff === 0 ? 24 * 60 : diff;
      if (limitMax && max * 60 > minutesAvailable) {
        errors.max_hours_study_per_day = [
          "Max task time exceeds your available day length.",
        ];
      }
    });
  }

  return errors;
};

