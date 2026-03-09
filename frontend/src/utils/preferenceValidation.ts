import type { Preference } from "@/types";

/**
 * Validates a user preference object and returns field-level errors.
 * @param preference - The preference values to validate.
 * @returns A record mapping field names to their validation error messages.
 */
export const validatePreference = (preference: Preference): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};
  const max = preference.max_hours_study_per_day;

  if (Number.isNaN(max)) {
    errors.max_hours_study_per_day = ["Must be a number."];
  } else if (max < 0) {
    errors.max_hours_study_per_day = ["Must be at least 0."];
  } else if (max > 24) {
    errors.max_hours_study_per_day = ["Must be 24 or less."];
  }

  if (!preference.day_start) {
    errors.day_start = ["Required."];
  }
  if (!preference.day_end) {
    errors.day_end = ["Required."];
  }

  return errors;
};
