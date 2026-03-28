import { useState } from "react";
import type { Event } from "@/types";
import type { ReminderFormState } from "@/hooks/eventForm/useEventFormTypes";
import {
    buildInitialEndDateTime,
    buildInitialStartDateTime,
    toLocalDateInputValue,
    toTimeInputValue,
} from "@/hooks/eventForm/eventFormDates";
import { fromMinutesBefore } from "@/hooks/eventForm/eventFormReminderHelpers";
import { INITIAL_VALIDATION_NOW_MS } from "@/hooks/eventForm/useEventFormHandlers";

/**
 * Returns all categories selected by an event.
 * @param event A given Event
 * @returns Selected categories
 */
function initialSelectedCategories(event?: Event) {
    return event?.categories?.map((c) => (typeof c === "object" ? c.id : c)) ?? [];
}

/**
 * List of all Reminders for an Event
 * @param event A given event.
 * @returns List of Reminders, potentially empty.
 */
function initialReminders(event?: Event): ReminderFormState[] {
    return event?.reminders?.map(({ send_email, send_push, minutes_before }) => {
        const { value, unit } = fromMinutesBefore(minutes_before);
        return { send_email, send_push, value, unit };
    }) ?? [];
}

/**
 * Geenerates states for EventForm
 * @param defaultColour defaultColour (string)
 * @param initialData An optional initial Event.
 */
export function useEventFormState(defaultColour: string, initialData?: Event) {
    const initialStart = buildInitialStartDateTime(initialData?.start_time);
    const initialEnd = buildInitialEndDateTime(
        initialData?.end_time,
        initialStart,
        Boolean(initialData?.start_time),
    );

    const [title, setTitle] = useState(initialData?.title ?? "");
    const [description, setDescription] = useState(initialData?.description ?? "");
    const [location, setLocation] = useState(initialData?.location ?? "");
    const [startDate, setStartDate] = useState(toLocalDateInputValue(initialStart));
    const [startTime, setStartTime] = useState(toTimeInputValue(initialStart));
    const [endDate, setEndDate] = useState(
        initialData?.end_time ? toLocalDateInputValue(initialEnd) : "",
    );
    const [endTime, setEndTime] = useState(
        initialData?.end_time || initialData?.start_time
            ? toTimeInputValue(initialEnd)
            : "",
    );
    const [selectedCategories, setSelectedCategories] = useState(initialSelectedCategories(initialData));
    const [colour, setColour] = useState(initialData?.colour ?? defaultColour);
    const [recurrenceEnabled, setRecurrenceEnabled] = useState(Boolean(initialData?.recurrence_interval));
    const [recurrenceInterval, setRecurrenceInterval] = useState<string | null>(
        initialData?.recurrence_interval ?? null,
    );
    const [recurrenceEnd, setRecurrenceEnd] = useState(initialData?.recurrence_end ?? "");
    const [reminders, setReminders] = useState<ReminderFormState[]>(initialReminders(initialData));
    const [showPickerMenu, setShowPickerMenu] = useState(false);
    const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);
    const [colourInput, setColourInput] = useState(colour);
    const [colourError, setColourError] = useState<string | null>(null);
    const [pushDeniedNotice, setPushDeniedNotice] = useState<Record<number, boolean>>({});
    const [validationNowMs, setValidationNowMs] = useState<number>(
        INITIAL_VALIDATION_NOW_MS,
    );
    const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState<number | null>(null);
    const [clockSkewWarning, setClockSkewWarning] = useState<string | null>(null);

    return {
        title, setTitle,
        description, setDescription,
        location, setLocation,
        startDate, setStartDate,
        startTime, setStartTime,
        endDate, setEndDate,
        endTime, setEndTime,
        selectedCategories, setSelectedCategories,
        colour, setColour,
        recurrenceEnabled, setRecurrenceEnabled,
        recurrenceInterval, setRecurrenceInterval,
        recurrenceEnd, setRecurrenceEnd,
        reminders, setReminders,
        showPickerMenu, setShowPickerMenu,
        pickerPosition, setPickerPosition,
        colourInput, setColourInput,
        colourError, setColourError,
        pushDeniedNotice, setPushDeniedNotice,
        validationNowMs, setValidationNowMs,
        serverTimeOffsetMs, setServerTimeOffsetMs,
        clockSkewWarning, setClockSkewWarning,
    };
}