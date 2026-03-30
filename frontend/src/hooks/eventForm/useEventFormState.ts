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
  return event?.reminders?.map(({ send_push, minutes_before }) => {
    const { value, unit } = fromMinutesBefore(minutes_before);
    return { send_push, value, unit };
  }) ?? [];
}

function useEventFormTextState(initialData?: Event) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");

  return { title, setTitle, description, setDescription, location, setLocation };
}

function useEventFormDateTimeState(initialData?: Event) {
  const initialStart = buildInitialStartDateTime(initialData?.start_time);
  const initialEnd = buildInitialEndDateTime(
    initialData?.end_time,
    initialStart,
    Boolean(initialData?.start_time),
  );
  const [startDate, setStartDate] = useState(toLocalDateInputValue(initialStart));
  const [startTime, setStartTime] = useState(toTimeInputValue(initialStart));
  const [endDate, setEndDate] = useState(
    initialData?.end_time ? toLocalDateInputValue(initialEnd) : "",
  );
  const [endTime, setEndTime] = useState(
    initialData?.end_time || initialData?.start_time ? toTimeInputValue(initialEnd) : "",
  );

  return { startDate, setStartDate, startTime, setStartTime, endDate, setEndDate, endTime, setEndTime };
}

function useEventFormCategoryColourState(defaultColour: string, initialData?: Event) {
  const [selectedCategories, setSelectedCategories] = useState(initialSelectedCategories(initialData));
  const [colour, setColour] = useState(initialData?.colour ?? defaultColour);
  const [colourInput, setColourInput] = useState(initialData?.colour ?? defaultColour);
  const [colourError, setColourError] = useState<string | null>(null);
  const [showPickerMenu, setShowPickerMenu] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);

  return {
    selectedCategories,
    setSelectedCategories,
    colour,
    setColour,
    colourInput,
    setColourInput,
    colourError,
    setColourError,
    showPickerMenu,
    setShowPickerMenu,
    pickerPosition,
    setPickerPosition,
  };
}

function useEventFormRecurrenceState(initialData?: Event) {
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(Boolean(initialData?.recurrence_interval));
  const [recurrenceInterval, setRecurrenceInterval] = useState<string | null>(
    initialData?.recurrence_interval ?? null,
  );
  const [recurrenceEnd, setRecurrenceEnd] = useState(initialData?.recurrence_end ?? "");

  return {
    recurrenceEnabled,
    setRecurrenceEnabled,
    recurrenceInterval,
    setRecurrenceInterval,
    recurrenceEnd,
    setRecurrenceEnd,
  };
}

function useEventFormReminderState(initialData?: Event) {
  const [reminders, setReminders] = useState<ReminderFormState[]>(initialReminders(initialData));
  const [pushDeniedNotice, setPushDeniedNotice] = useState<Record<number, boolean>>({});

  return { reminders, setReminders, pushDeniedNotice, setPushDeniedNotice };
}

function useEventFormValidationState() {
  const [validationNowMs, setValidationNowMs] = useState<number>(INITIAL_VALIDATION_NOW_MS);
  const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState<number | null>(null);
  const [clockSkewWarning, setClockSkewWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  return {
    validationNowMs,
    setValidationNowMs,
    serverTimeOffsetMs,
    setServerTimeOffsetMs,
    clockSkewWarning,
    setClockSkewWarning,
    isSubmitting,
    setIsSubmitting,
    submitError,
    setSubmitError,
  };
}

/**
 * Generates states for EventForm
 * @param defaultColour defaultColour (string)
 * @param initialData An optional initial Event.
 */
export function useEventFormState(defaultColour: string, initialData?: Event) {
  const textState = useEventFormTextState(initialData);
  const dateTimeState = useEventFormDateTimeState(initialData);
  const categoryColourState = useEventFormCategoryColourState(defaultColour, initialData);
  const recurrenceState = useEventFormRecurrenceState(initialData);
  const reminderState = useEventFormReminderState(initialData);
  const validationState = useEventFormValidationState();

  return {
    ...textState,
    ...dateTimeState,
    ...categoryColourState,
    ...recurrenceState,
    ...reminderState,
    ...validationState,
  };
}
