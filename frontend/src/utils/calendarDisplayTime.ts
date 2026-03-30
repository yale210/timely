import { getZonedDateParts } from "@/utils/userTimezone";

export const CALENDAR_DISPLAY_TIMEZONE = "UTC";

const buildDateFromZonedParts = (parts: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}, timeZone: string): Date => {
  let utcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  for (let i = 0; i < 4; i += 1) {
    const current = getZonedDateParts(new Date(utcGuess), timeZone);
    const desiredUtcEquivalent = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const actualUtcEquivalent = Date.UTC(
      current.year,
      current.month - 1,
      current.day,
      current.hour,
      current.minute,
      current.second,
    );
    const diffMs = desiredUtcEquivalent - actualUtcEquivalent;

    if (diffMs === 0) {
      break;
    }

    utcGuess += diffMs;
  }

  return new Date(utcGuess);
};

/**
 * Converts a real timestamp into the synthetic UTC-backed calendar display clock.
 * @param value - Real date or ISO timestamp.
 * @param timeZone - Active user timezone.
 * @returns Synthetic display date used by the calendar UI.
 */
export const toCalendarDisplayDate = (value: Date | string, timeZone: string): Date => {
  const sourceDate = value instanceof Date ? value : new Date(value);
  const parts = getZonedDateParts(sourceDate, timeZone);
  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ),
  );
};

/**
 * Converts a synthetic calendar display date back into a real timestamp.
 * @param value - Synthetic display date.
 * @param timeZone - Active user timezone.
 * @returns Real date in the target timezone.
 */
export const fromCalendarDisplayDate = (value: Date, timeZone: string): Date => buildDateFromZonedParts(
  {
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
    hour: value.getUTCHours(),
    minute: value.getUTCMinutes(),
    second: value.getUTCSeconds(),
  },
  timeZone,
);

/**
 * Formats a synthetic display date using the selected time format.
 * @param value - Synthetic display date.
 * @param timeFormat - User-selected time format.
 * @returns Formatted time label.
 */
export const formatCalendarDisplayTime = (
  value: Date,
  timeFormat: "24h" | "12h",
): string => {
  const hours24 = value.getUTCHours();
  const minutes = value.getUTCMinutes();

  if (timeFormat === "24h") {
    return `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  const isPm = hours24 >= 12;
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const suffix = isPm ? "pm" : "am";
  if (minutes === 0) {
    return `${hours12}${suffix}`;
  }

  return `${hours12}:${String(minutes).padStart(2, "0")}${suffix}`;
};

/**
 * Returns the display-layer day of week for a synthetic calendar date.
 * @param value - Synthetic display date.
 * @returns UTC-backed day-of-week index.
 */
export const getCalendarDisplayDayOfWeek = (value: Date): number => value.getUTCDay();

/**
 * Returns the number of display minutes since midnight for a synthetic calendar date.
 * @param value - Synthetic display date.
 * @returns Minutes since midnight in the display clock.
 */
export const getCalendarDisplayMinutes = (value: Date): number => (
  (value.getUTCHours() * 60) + value.getUTCMinutes()
);
