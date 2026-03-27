import type { Preference } from "@/types";

const DEFAULT_DAY_START = "08:00";
const DEFAULT_DAY_END = "22:00";

const dayLabels: readonly [number, string][] = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
  [7, "Sun"],
] as const;

/**
 * Builds a fallback weekly schedule using the provided day start and end times.
 * @param start - Fallback day start in HH:MM format.
 * @param end - Fallback day end in HH:MM format.
 * @returns A seven-day schedule using the same hours every day.
 */
const buildDefaultSchedule = (start: string, end: string) =>
  dayLabels.map(([day]) => ({ day, start, end }));

/**
 * Parses an HH:MM time string into minutes since midnight.
 * @param value - Time string to parse.
 * @returns Minutes since midnight, or null if parsing fails.
 */
const toMinutes = (value: string): number | null => {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number.parseInt(hourRaw ?? "", 10);
  const minute = Number.parseInt(minuteRaw ?? "", 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return (hour * 60) + minute;
};

const getScheduleMaxMinutes = (pref: Preference): number => {
  const schedule = pref.day_schedule && pref.day_schedule.length > 0
    ? pref.day_schedule
    : buildDefaultSchedule(pref.day_start?.slice(0, 5) ?? DEFAULT_DAY_START, pref.day_end?.slice(0, 5) ?? DEFAULT_DAY_END);

  let maxMinutes = 0;
  schedule.forEach((entry) => {
    const start = toMinutes(entry.start);
    const end = toMinutes(entry.end);
    if (start === null || end === null) return;
    const diff = (end - start + (24 * 60)) % (24 * 60);
    const minutesAvailable = diff === 0 ? 24 * 60 : diff;
    if (minutesAvailable > maxMinutes) {
      maxMinutes = minutesAvailable;
    }
  });

  return maxMinutes;
};

/**
 * Computes the widest schedulable day length from the user's weekly schedule.
 * @param pref - The scheduling preferences to inspect.
 * @returns The maximum available daily minutes across the current schedule.
 */
export const getAvailableSchedulingDayMaxMinutes = (pref: Preference | null): number => {
  if (!pref) {
    return 24 * 60;
  }

  return getScheduleMaxMinutes(pref);
};

/**
 * Computes the maximum number of minutes the user can schedule in a single day.
 * @param pref - The scheduling preferences to derive the daily cap from.
 * @returns The effective daily scheduling cap in minutes.
 */
export const getSchedulingDayMaxMinutes = (pref: Preference | null): number => {
  if (!pref) {
    return 24 * 60;
  }

  const scheduleMaxMinutes = getAvailableSchedulingDayMaxMinutes(pref);
  if (pref.limit_max_hours === false) {
    return scheduleMaxMinutes;
  }

  const preferenceCapMinutes = Math.max(0, Number(pref.max_hours_study_per_day ?? 0) * 60);
  return Math.min(scheduleMaxMinutes, preferenceCapMinutes || scheduleMaxMinutes);
};
