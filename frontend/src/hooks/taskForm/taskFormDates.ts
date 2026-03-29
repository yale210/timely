import {
    combineTimezoneDateAndTimeToIso,
    getStoredUserTimezone,
    toTimezoneDateInputValue,
    toTimezoneTimeInputValue,
} from "@/utils/userTimezone";

/**
 * Converts a Date to an ISO string, or returns an empty string for an invalid date.
 * @param value The Date object to convert.
 * @returns An ISO string, or an empty string if the date is invalid.
 */
export function toIsoOrEmpty(value: Date): string {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();
}

/**
 * Converts an ISO-like date string into a timezone-aware date input value.
 * @param value The source date string.
 * @returns A YYYY-MM-DD value suitable for a date input.
 */
export function toDateInputValue(value?: string): string {
    if (!value) return "";
    return toTimezoneDateInputValue(value, getStoredUserTimezone());
}

/**
 * Converts an ISO-like date string into a timezone-aware time input value.
 * @param value The source date string.
 * @param fallback The fallback value when no source value is provided.
 * @returns An HH:MM value suitable for a time input.
 */
export function toTimeInputValue(value?: string, fallback = ""): string {
    if (!value) return fallback;
    return toTimezoneTimeInputValue(value, getStoredUserTimezone());
}

/**
 * Builds the task start Date object from date and time input values.
 * @param date The selected task date.
 * @param startTime The selected task start time.
 * @returns A Date object representing the task start.
 */
export function buildTaskStartDateTime(date: string, startTime: string): Date {
    return new Date(
        combineTimezoneDateAndTimeToIso(date, startTime, getStoredUserTimezone()),
    );
}

/**
 * Builds the task deadline Date object from date and time input values.
 * @param deadline The selected deadline date.
 * @param deadlineTime The selected deadline time.
 * @returns A Date object representing the task deadline.
 */
export function buildTaskDeadlineDateTime(
    deadline: string,
    deadlineTime: string,
): Date {
    return new Date(
        combineTimezoneDateAndTimeToIso(
        deadline,
        deadlineTime,
        getStoredUserTimezone(),
        ),
    );
}

/**
 * Builds a preview Date object from date and time input values.
 * @param date The selected preview date.
 * @param startTime The selected preview time.
 * @returns A Date object representing the preview start.
 */
export function buildPreviewStartDate(date: string, startTime: string): Date {
    return new Date(
        combineTimezoneDateAndTimeToIso(date, startTime, getStoredUserTimezone()),
    );
}