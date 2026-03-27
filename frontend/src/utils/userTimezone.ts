import { useSyncExternalStore } from "react";
import { getStoredTimeFormat } from "@/utils/userPreferences";

export const USER_TIMEZONE_STORAGE_KEY = "user_timezone";
export const USER_TIMEZONE_CHANGE_EVENT = "user-timezone-change";

const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

const dispatchTimezoneChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(USER_TIMEZONE_CHANGE_EVENT));
  }
};

const parseDateParts = (value: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value);
  if (!match) {
    return null;
  }

  return {
    year: Number.parseInt(match[1], 10),
    month: Number.parseInt(match[2], 10),
    day: Number.parseInt(match[3], 10),
    hour: Number.parseInt(match[4] ?? "0", 10),
    minute: Number.parseInt(match[5] ?? "0", 10),
  };
};

const getFormatter = (
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat => new Intl.DateTimeFormat("en-GB", {
  timeZone,
  ...options,
});

const getZonedParts = (date: Date, timeZone: string) => {
  const parts = getFormatter(timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes): number => (
    Number.parseInt(parts.find((part) => part.type === type)?.value ?? "0", 10)
  );

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
    second: pick("second"),
  };
};

const buildIsoFromZonedParts = (parts: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}, timeZone: string) => {
  let utcGuess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);

  for (let i = 0; i < 4; i += 1) {
    const current = getZonedParts(new Date(utcGuess), timeZone);
    const desiredUtcEquivalent = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    const actualUtcEquivalent = Date.UTC(
      current.year,
      current.month - 1,
      current.day,
      current.hour,
      current.minute,
    );
    const diffMs = desiredUtcEquivalent - actualUtcEquivalent;
    if (diffMs === 0) {
      break;
    }
    utcGuess += diffMs;
  }

  return new Date(utcGuess).toISOString();
};

/**
 * Returns the currently selected app timezone, falling back to the browser timezone.
 * @returns The active IANA timezone identifier.
 */
export const getStoredUserTimezone = (): string => {
  if (typeof window === "undefined") {
    return "UTC";
  }

  return localStorage.getItem(USER_TIMEZONE_STORAGE_KEY) ?? getBrowserTimezone();
};

/**
 * Persists the selected app timezone and notifies subscribers.
 * @param timeZone - IANA timezone identifier to store.
 */
export const setStoredUserTimezone = (timeZone: string) => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(USER_TIMEZONE_STORAGE_KEY, timeZone);
  dispatchTimezoneChange();
};

/**
 * Clears the stored app timezone so the browser timezone is used again.
 */
export const resetStoredUserTimezone = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(USER_TIMEZONE_STORAGE_KEY);
  dispatchTimezoneChange();
};

/**
 * Subscribes React components to the current app timezone.
 * @returns The active IANA timezone identifier.
 */
export const useUserTimezone = (): string => useSyncExternalStore(
  (onStoreChange) => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const handler = () => onStoreChange();
    window.addEventListener(USER_TIMEZONE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(USER_TIMEZONE_CHANGE_EVENT, handler);
  },
  getStoredUserTimezone,
  () => "UTC",
);

/**
 * Formats a timestamp using the selected timezone.
 * @param value - ISO string or Date to format.
 * @param options - Optional Intl formatting overrides.
 * @param timeZone - Optional timezone override.
 * @returns Formatted date/time text.
 */
export const formatDateTimeInTimezone = (
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {},
  timeZone = getStoredUserTimezone(),
): string => {
  const date = value instanceof Date ? value : new Date(value);
  const timeFormat = getStoredTimeFormat();
  const hasCustomDateOrTimeOptions = (
    options.dateStyle != null
    || options.timeStyle != null
    || options.year != null
    || options.month != null
    || options.day != null
    || options.hour != null
    || options.minute != null
    || options.second != null
  );
  return getFormatter(timeZone, {
    ...(hasCustomDateOrTimeOptions ? {} : { dateStyle: "medium", timeStyle: "short" }),
    ...(options.hour12 == null && options.hourCycle == null
      ? (timeFormat === "12h" ? { hour12: true } : { hourCycle: "h23" })
      : {}),
    ...options,
  }).format(date);
};

/**
 * Formats a date using the selected timezone.
 * @param value - ISO string or Date to format.
 * @param options - Optional Intl formatting overrides.
 * @param timeZone - Optional timezone override.
 * @returns Formatted date text.
 */
export const formatDateInTimezone = (
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {},
  timeZone = getStoredUserTimezone(),
): string => {
  const date = value instanceof Date ? value : new Date(value);
  const hasDateOptions = options.dateStyle != null || options.year != null || options.month != null || options.day != null;
  return getFormatter(timeZone, {
    ...(hasDateOptions ? {} : { dateStyle: "medium" }),
    ...options,
  }).format(date);
};

/**
 * Formats a clock time using the selected timezone.
 * @param value - ISO string or Date to format.
 * @param options - Optional Intl formatting overrides.
 * @param timeZone - Optional timezone override.
 * @returns Formatted time text.
 */
export const formatTimeInTimezone = (
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {},
  timeZone = getStoredUserTimezone(),
): string => {
  const date = value instanceof Date ? value : new Date(value);
  const timeFormat = getStoredTimeFormat();
  const hasTimeOptions = (
    options.timeStyle != null
    || options.hour != null
    || options.minute != null
    || options.second != null
  );
  return getFormatter(timeZone, {
    ...(hasTimeOptions ? {} : {
      hour: "2-digit",
      minute: "2-digit",
      ...(timeFormat === "12h" ? { hour12: true } : { hourCycle: "h23" }),
    }),
    ...(options.hour12 == null && options.hourCycle == null
      ? (timeFormat === "12h" ? { hour12: true } : { hourCycle: "h23" })
      : {}),
    ...options,
  }).format(date);
};

/**
 * Converts an ISO timestamp into a date-input value in the selected timezone.
 * @param value - ISO string or Date to convert.
 * @param timeZone - Optional timezone override.
 * @returns A YYYY-MM-DD date string.
 */
export const toTimezoneDateInputValue = (
  value: string | Date,
  timeZone = getStoredUserTimezone(),
): string => {
  const date = value instanceof Date ? value : new Date(value);
  const parts = getZonedParts(date, timeZone);
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
};

/**
 * Converts an ISO timestamp into a time-input value in the selected timezone.
 * @param value - ISO string or Date to convert.
 * @param timeZone - Optional timezone override.
 * @returns An HH:MM time string.
 */
export const toTimezoneTimeInputValue = (
  value: string | Date,
  timeZone = getStoredUserTimezone(),
): string => {
  const date = value instanceof Date ? value : new Date(value);
  const parts = getZonedParts(date, timeZone);
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
};

/**
 * Converts an ISO timestamp into a datetime-local input value in the selected timezone.
 * @param value - ISO string or Date to convert.
 * @param timeZone - Optional timezone override.
 * @returns A YYYY-MM-DDTHH:MM string.
 */
export const toTimezoneDateTimeLocalValue = (
  value?: string | Date | null,
  timeZone = getStoredUserTimezone(),
): string => {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  const parts = getZonedParts(date, timeZone);
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
};

/**
 * Converts separate date and time input values in the selected timezone into UTC ISO.
 * @param dateValue - Date input value in YYYY-MM-DD format.
 * @param timeValue - Time input value in HH:MM format.
 * @param timeZone - Optional timezone override.
 * @returns A UTC ISO timestamp or an empty string for invalid input.
 */
export const combineTimezoneDateAndTimeToIso = (
  dateValue: string,
  timeValue: string,
  timeZone = getStoredUserTimezone(),
): string => {
  const parsed = parseDateParts(`${dateValue}T${timeValue}`);
  if (!parsed) {
    return "";
  }

  return buildIsoFromZonedParts(parsed, timeZone);
};

/**
 * Converts a datetime-local input value in the selected timezone into UTC ISO.
 * @param value - Datetime-local value in YYYY-MM-DDTHH:MM format.
 * @param timeZone - Optional timezone override.
 * @returns A UTC ISO timestamp or an empty string for invalid input.
 */
export const timezoneDateTimeLocalToIso = (
  value: string,
  timeZone = getStoredUserTimezone(),
): string => {
  const parsed = parseDateParts(value);
  if (!parsed) {
    return "";
  }

  let utcGuess = Date.UTC(parsed.year, parsed.month - 1, parsed.day, parsed.hour, parsed.minute);

  for (let i = 0; i < 4; i += 1) {
    const current = getZonedParts(new Date(utcGuess), timeZone);
    const desiredUtcEquivalent = Date.UTC(
      parsed.year,
      parsed.month - 1,
      parsed.day,
      parsed.hour,
      parsed.minute,
    );
    const actualUtcEquivalent = Date.UTC(
      current.year,
      current.month - 1,
      current.day,
      current.hour,
      current.minute,
    );
    const diffMs = desiredUtcEquivalent - actualUtcEquivalent;
    if (diffMs === 0) {
      break;
    }
    utcGuess += diffMs;
  }

  return buildIsoFromZonedParts(parsed, timeZone);
};
