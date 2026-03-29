import type { Event, EventSubmission } from "@/types";

interface NormalisedEventReminder {
    send_email: boolean;
    send_push: boolean;
    minutes_before: number;
}

/**
 * Standardised EventSubmission as stored in the backend.
 */
export interface NormalisedEventSubmission {
    title: string;
    description: string;
    location: string;
    start_time: string;
    end_time: string;
    colour: string;
    categories: number[];
    recurrence_interval: Event["recurrence_interval"];
    recurrence_end: string | null;
    reminders: NormalisedEventReminder[];
}

/**
 * Normalises an EventSubmission from an incomplete one.
 * @param submission Arguaments given by EventForm
 */
export function normaliseEventSubmission(
    submission: EventSubmission,
): NormalisedEventSubmission {
    return {
        title: submission.title ?? "",
        description: submission.description ?? "",
        location: submission.location ?? "",
        start_time: submission.start_time ?? "",
        end_time: submission.end_time ?? "",
        colour: submission.colour ?? "",
        categories: [...(submission.categories ?? [])].sort((a, b) => a - b),
        recurrence_interval: submission.recurrence_interval ?? null,
        recurrence_end: submission.recurrence_end ?? null,
        reminders: normaliseEventReminders(submission),
    };
}

function normaliseEventReminders(submission: EventSubmission) {
    return [...(submission.reminders ?? [])]
        .map((reminder) => ({
        send_email: Boolean(reminder.send_email),
        send_push: Boolean(reminder.send_push),
        minutes_before: Number(reminder.minutes_before),
        }))
        .sort(compareEventReminders);
}

function compareEventReminders(
    left: NormalisedEventReminder,
    right: NormalisedEventReminder,
) {
    if (left.minutes_before !== right.minutes_before) {
        return left.minutes_before - right.minutes_before;
    }
    if (left.send_email !== right.send_email) {
        return Number(left.send_email) - Number(right.send_email);
    }
    return Number(left.send_push) - Number(right.send_push);
}

/**
 * Equality check for 2 NormalisedEventSubmission
 * @param left NormalisedEventSubmission a
 * @param right NormalisedEventSubmission b
 */
export function isEventSubmissionEqual(
    left: NormalisedEventSubmission,
    right: NormalisedEventSubmission,
) {
    return JSON.stringify(left) === JSON.stringify(right);
}