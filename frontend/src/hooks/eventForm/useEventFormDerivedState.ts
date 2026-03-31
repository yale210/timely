import { useMemo, useState } from "react";
import { getOverrideColour } from "@/utils/colorUtils";
import type { Category, Event, EventSubmission } from "@/types";
import type { ReminderFormState } from "@/hooks/eventForm/useEventFormTypes";
import { safeToISOString, buildEventDateTime } from "@/hooks/eventForm/eventFormDates";
import { toMinutesBefore, buildPastReminderIndices } from "@/hooks/eventForm/eventFormReminderHelpers";
import {
  normaliseEventSubmission,
  isEventSubmissionEqual,
} from "@/hooks/eventForm/normaliseEventSubmission";

interface Args {
  categories: Category[];
  selectedCategories: number[];
  colour: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  recurrenceInterval: string | null;
  recurrenceEnd: string;
  reminders: ReminderFormState[];
  validationNowMs: number;
  serverTimeOffsetMs: number | null;
}

function getSelectedCategoryObjects(
  categories: Category[],
  selectedCategories: number[],
) {
  return categories.filter((category) => selectedCategories.includes(category.id));
}

function getEventColourState(selectedCategoryObjects: Category[], colour: string) {
  const overrideColour = getOverrideColour(selectedCategoryObjects);

  return {
    isColourLocked: Boolean(overrideColour),
    displayColour: overrideColour ?? colour,
  };
}

function getEventTimeState(args: Args) {
  const startDateTime = buildEventDateTime(args.startDate, args.startTime);
  const endDateTime = buildEventDateTime(args.endDate, args.endTime);
  const isTimeInvalid =
    Number.isNaN(startDateTime.getTime())
    || Number.isNaN(endDateTime.getTime())
    || startDateTime >= endDateTime;

  return { startDateTime, endDateTime, isTimeInvalid };
}

function getEventReminderState(args: Args, startDateTime: Date) {
  const now = new Date(args.validationNowMs + (args.serverTimeOffsetMs ?? 0));
  const pastReminderIndices = buildPastReminderIndices(args.reminders, startDateTime, now);

  return {
    canAddReminder: args.reminders.length < 5,
    pastReminderIndices,
  };
}

function buildEventFormErrors(isTimeInvalid: boolean, pastReminderIndices: Set<number>) {
  return {
    time: isTimeInvalid,
    reminders: pastReminderIndices.size > 0,
  };
}

/**
 * Builds a full EventSubmission from arguaments not yet in the correct format.
 * @param args Args as stored in EventForm.
 */
export function buildSubmission(args: Args): EventSubmission {
  const startDateTime = buildEventDateTime(args.startDate, args.startTime);
  const endDateTime = buildEventDateTime(args.endDate, args.endTime);

  return {
    title: args.title,
    description: args.description,
    location: args.location,
    start_time: safeToISOString(startDateTime),
    end_time: safeToISOString(endDateTime),
    colour: args.colour,
    categories: args.selectedCategories,
    recurrence_interval: (args.recurrenceInterval as Event["recurrence_interval"]) ?? null,
    recurrence_end: args.recurrenceEnd || null,
    reminders: args.reminders.map((r) => ({
      send_push: r.send_push,
      minutes_before: toMinutesBefore(r.value, r.unit),
    })),
  };
}

/**
 * Builds states from the current information passed in by EventForm.
 * @param args Args as stored in EventForm.
 */
export function useEventFormDerivedState(args: Args) {
  const selectedCategoryObjects = useMemo(
    () => getSelectedCategoryObjects(args.categories, args.selectedCategories),
    [args.categories, args.selectedCategories],
  );
  const { isColourLocked, displayColour } = getEventColourState(
    selectedCategoryObjects,
    args.colour,
  );
  const { startDateTime, endDateTime, isTimeInvalid } = getEventTimeState(args);
  const { canAddReminder, pastReminderIndices } = getEventReminderState(args, startDateTime);
  const errors = buildEventFormErrors(isTimeInvalid, pastReminderIndices);
  const hasErrors = errors.time || errors.reminders;
  const submission = buildSubmission(args);

  return {
    isColourLocked,
    displayColour,
    startDateTime,
    endDateTime,
    canAddReminder,
    pastReminderIndices,
    errors,
    hasErrors,
    submission,
  };
}

/**
 * Checks if there have been changes in the Event when submitting or not.
 * @param submission An EventSubmission
 */
export function useEventSubmissionChanges(submission: EventSubmission) {
  const normalisedCurrentSubmission = useMemo(() => {
    return normaliseEventSubmission(submission);
  }, [submission]);

  const [initialSubmission] = useState(() => normaliseEventSubmission(submission));
  const hasChanges = !isEventSubmissionEqual(
    normalisedCurrentSubmission,
    initialSubmission,
  );

  return { hasChanges };
}
