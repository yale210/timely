import {
    combineTimezoneDateAndTimeToIso,
    getStoredUserTimezone,
    toTimezoneDateInputValue,
    toTimezoneTimeInputValue,
} from "@/utils/userTimezone";

export const ONE_HOUR_MS = 60 * 60 * 1_000;

/**
 * Safely convert a Date to ISO string, returning "" for invalid dates.
 * @param value A Date value
 * @returns Date in string form.
 */
export function safeToISOString(value: Date): string {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();
}

/**
 * Creates a new Date using the given base date with its time set to the supplied hour and minute.
 * @param base - The base date to copy.
 * @param hour - The hour to apply to the copied date.
 * @param minute - The minute to apply to the copied date.
 * @returns A new Date with the updated time.
 */
export function withTime(base: Date, hour: number, minute: number) {
    const value = new Date(base);
    value.setHours(hour, minute, 0, 0);
    return value;
}

/**
 * Formats a Date as a timezone-aware date input string for the stored user timezone.
 * @param value - The date value to format.
 * @returns A date string suitable for a date input.
 */
export function toLocalDateInputValue(value: Date) {
    return toTimezoneDateInputValue(value, getStoredUserTimezone());
}

/**
 * Formats a Date as a timezone-aware time input string for the stored user timezone.
 * @param value - The date value to format.
 * @returns A time string suitable for a time input.
 */
export function toTimeInputValue(value: Date) {
    return toTimezoneTimeInputValue(value, getStoredUserTimezone());
}

/**
 * Builds the initial event start date and time.
 * Uses the provided start time when available, otherwise defaults to today at 10:00.
 * @param startTime - An optional ISO datetime string for the initial start time.
 * @returns The initial start Date for the event form.
 */
export function buildInitialStartDateTime(startTime?: string) {
    if (startTime) return new Date(startTime);
    return withTime(new Date(), 10, 0);
}

/**
 * Builds the initial event end date and time.
 * Uses the provided end time when available, otherwise derives a sensible default from the start time.
 * @param endTime - An optional ISO datetime string for the initial end time.
 * @param startDateTime - The resolved initial start date and time.
 * @param hasInitialStart - Whether the event already has an initial start time.
 * @returns The initial end Date for the event form.
 */
export function buildInitialEndDateTime(
    endTime: string | undefined,
    startDateTime: Date,
    hasInitialStart: boolean,
) {
    if (endTime) return new Date(endTime);
    if (hasInitialStart) return new Date(startDateTime.getTime() + ONE_HOUR_MS);
    return withTime(startDateTime, 11, 0);
}

/**
 * Builds a Date from separate start date and start time input values.
 * @param startDate - The selected start date string.
 * @param startTime - The selected start time string.
 * @returns A Date representing the event start.
 */
export function buildEventStartDateTime(startDate: string, startTime: string) {
    return new Date(`${startDate}T${startTime}`);
}

/**
 * Builds a Date from separate end date and end time input values.
 * @param endDate - The selected end date string.
 * @param endTime - The selected end time string.
 * @returns A Date representing the event end.
 */
export function buildEventEndDateTime(endDate: string, endTime: string) {
    return new Date(`${endDate}T${endTime}`);
}

/**
 * Builds a timezone-aware Date from separate date and time input values
 * using the stored user timezone.
 * @param date - The selected date string.
 * @param time - The selected time string.
 * @returns A Date representing the combined date and time in the user's timezone.
 */
export function buildEventDateTime(date: string, time: string) {
    return new Date(
        combineTimezoneDateAndTimeToIso(date, time, getStoredUserTimezone()),
    );
}