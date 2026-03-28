/**
 * TimeUnit data structure.
 */
export type TimeUnit = "minutes" | "hours" | "days" | "weeks" | "months" | "years";

/**
 * Reminder information data structure.
 */
export interface ReminderFormState {
    send_email: boolean;
    send_push: boolean;
    value: number;
    unit: TimeUnit;
}

export const UNIT_TO_MINUTES: Record<TimeUnit, number> = {
    minutes: 1,
    hours: 60,
    days: 1440,
    weeks: 10080,
    months: 43200,
    years: 525600,
};

export const UNIT_LABELS: { value: TimeUnit; label: string }[] = [
    { value: "minutes", label: "minutes" },
    { value: "hours", label: "hours" },
    { value: "days", label: "days" },
    { value: "weeks", label: "weeks" },
    { value: "months", label: "months" },
    { value: "years", label: "years" },
];

/**
 * Converts a unit to minutes.
 * @param value number of unit.
 * @param unit unit as TimeUnit.
 */
export function toMinutesBefore(value: number, unit: TimeUnit) {
    return value * UNIT_TO_MINUTES[unit];
}

/**
 * Version oftoMinutesBefore without a given time unit.
 * @param minutes minute input.
 */
export function fromMinutesBefore(minutes: number) {
    const units: TimeUnit[] = ["years", "months", "weeks", "days", "hours", "minutes"];

    for (const unit of units) {
        const factor = UNIT_TO_MINUTES[unit];
        if (minutes >= factor && minutes % factor === 0) {
        return { value: minutes / factor, unit };
        }
    }

    return { value: minutes, unit: "minutes" as const };
}

/**
 * Builds a set of the indices of all past reminders.
 * @param reminders List of all reminders.
 * @param startDateTime A given start date.
 * @param now The current time.
 */
export function buildPastReminderIndices(
    reminders: ReminderFormState[],
    startDateTime: Date,
    now: Date,
) {
    const pastReminderIndices = new Set<number>();

    reminders.forEach((reminder, index) => {
        const minutesBefore = toMinutesBefore(reminder.value, reminder.unit);
        const triggerAt = new Date(startDateTime.getTime() - minutesBefore * 60_000);
        if (triggerAt <= now) pastReminderIndices.add(index);
    });

    return pastReminderIndices;
}