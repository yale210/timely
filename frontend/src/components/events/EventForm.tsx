import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { CategoryColourPicker, CategoryMultiSelect, Tooltip } from "@/components";
import { usePushSubscription } from "@/hooks/notifications/usePushSubscription";
import type { EventFormProps, NormalisedEventSubmission } from "@/hooks/eventForm/useEventFormTypes";
import type { EventSubmission } from "@/types";
import { getEventFormHandlers } from "@/hooks/eventForm/useEventFormHandlers";
import EventFormSave from "@/components/events/EventFormSave";
import EventFormColour from "@/components/events/EventFormColour";
import EventFormStartTime from "@/components/events/EventFormStartTime";
import EventFormEndTime from "@/components/events/EventFormEndTime";
import EventFormRecurrence from "@/components/events/EventFormRecurrence";
import EventFormReminder from "@/components/events/EventFormReminder";
import { useEventFormState } from "@/hooks/eventForm/useEventFormState";
import { useEventFormDerivedState, buildSubmission } from "@/hooks/eventForm/useEventFormDerivedState";
import { parseColourInput } from "@/hooks/parseColourInput";
import { useEventReminderActions } from "@/hooks/eventForm/useEventFormReminderActions";
import { formatDjangoFormError } from "@/utils/apiErrors";
import {
  useEventFormDataChange,
  useEventFormServerTimeSync,
  useColourPickerMenuEffect,
} from "@/hooks/eventForm/useEventFormHooks";

/**
 * Renders a form for creating or editing an event.
 * @param props Event form props.
 * @param props.initialData - Optional existing event data used to prefill the form.
 * @param props.categories - The available categories that can be assigned to the event.
 * @param props.onCreateCategory - Creates a new category from within the form.
 * @param props.onUpdateCategory - Updates an existing category from within the form.
 * @param props.onDeleteCategory - Deletes an existing category from within the form.
 * @param props.onSubmit - Submits the completed event form.
 * @param props.onCancel - Cancels the form and closes it.
 * @param props.onDataChange - Receives partial event form updates as the user edits fields.
 * @returns The rendered event form.
 */
const EventForm = ({
  initialData,
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onSubmit,
  onCancel,
  onDataChange,
}: EventFormProps) => {
  const defaultColour = "#f97316";
  const eventFormHandlers = getEventFormHandlers();
  const {
    isSubscribed,
    permission,
    subscribe,
    loading: pushLoading,
  } = usePushSubscription();
  const eventState = useEventFormState(defaultColour, initialData);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const buildArgs = () => ({
    categories,
    selectedCategories: eventState.selectedCategories,
    colour: eventState.colour,
    title: eventState.title,
    description: eventState.description,
    location: eventState.location,
    startDate: eventState.startDate,
    startTime: eventState.startTime,
    endDate: eventState.endDate,
    endTime: eventState.endTime,
    recurrenceInterval: eventState.recurrenceInterval,
    recurrenceEnd: eventState.recurrenceEnd,
    reminders: eventState.reminders,
    validationNowMs: eventState.validationNowMs,
    serverTimeOffsetMs: eventState.serverTimeOffsetMs,
  });
  useEventFormDataChange({
    onDataChange,
    startDate: eventState.startDate,
    startTime: eventState.startTime,
    title: eventState.title,
    description: eventState.description,
  });
  const refreshValidationNow = () => {
    eventState.setValidationNowMs(eventFormHandlers.getCurrentTimestamp());
  };
  useEventFormServerTimeSync({
    getCurrentTimestamp: eventFormHandlers.getCurrentTimestamp,
    clockSkewWarningThresholdMs:
      eventFormHandlers.CLOCK_SKEW_WARNING_THRESHOLD_MS,
    setServerTimeOffsetMs: eventState.setServerTimeOffsetMs,
    setValidationNowMs: eventState.setValidationNowMs,
    setClockSkewWarning: eventState.setClockSkewWarning,
  });

  const derivedValues = useEventFormDerivedState(buildArgs());
  const MAX_REMINDERS = 5;
  const canAddReminder = eventState.reminders.length < MAX_REMINDERS;
  const pastReminderIndices = new Set<number>();
  const now = new Date(
    eventState.validationNowMs + (eventState.serverTimeOffsetMs ?? 0),
  );

  eventState.reminders.forEach((reminder, index) => {
    const minutesBefore = eventFormHandlers.toMinutesBefore(
      reminder.value,
      reminder.unit,
    );
    const triggerAt = new Date(
      derivedValues.startDateTime.getTime() - minutesBefore * 60_000,
    );

    if (triggerAt <= now) {
      pastReminderIndices.add(index);
    }
  });

  const eventReminderActions = useEventReminderActions({
    reminders: eventState.reminders,
    canAddReminder,
    permission,
    isSubscribed,
    subscribe,
    setReminders: eventState.setReminders,
    setPushDeniedNotice: eventState.setPushDeniedNotice,
    setValidationNowMs: eventState.setValidationNowMs,
  });

  useColourPickerMenuEffect({
    showPickerMenu: eventState.showPickerMenu,
    pickerPosition: eventState.pickerPosition,
    pickerRef,
    setShowPickerMenu: eventState.setShowPickerMenu,
    setPickerPosition: eventState.setPickerPosition,
  });

  const normalisedCurrentSubmission =
    eventFormHandlers.normaliseEventSubmission(buildSubmission(buildArgs()));

  const [initialSubmission] = useState<NormalisedEventSubmission>(
    () => normalisedCurrentSubmission,
  );

  const hasChanges = !eventFormHandlers.isEventSubmissionEqual(
    normalisedCurrentSubmission,
    initialSubmission,
  );
  const submissionSnapshot = JSON.stringify(normalisedCurrentSubmission);
  const previousSubmissionSnapshotRef = useRef(submissionSnapshot);

  useEffect(() => {
    if (previousSubmissionSnapshotRef.current === submissionSnapshot) {
      return;
    }
    previousSubmissionSnapshotRef.current = submissionSnapshot;
    if (eventState.submitError) {
      eventState.setSubmitError(null);
    }
  }, [eventState, submissionSnapshot]);

  const handleFormSubmit = async () => {
    const data: EventSubmission = buildSubmission(buildArgs());

    try {
      eventState.setIsSubmitting(true);
      eventState.setSubmitError(null);
      await onSubmit(data);
    } catch (error) {
      eventState.setSubmitError(formatDjangoFormError(error).message);
      console.error(error);
    } finally {
      eventState.setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (derivedValues.hasErrors || !hasChanges) return;

    void handleFormSubmit();
  };

  const handleColourPickerToggle = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    if (derivedValues.isColourLocked) return;

    const rect = event.currentTarget.getBoundingClientRect();
    eventState.setPickerPosition({ top: rect.bottom + 8, left: rect.right - 272 });
    eventState.setColourInput(derivedValues.displayColour);
    eventState.setColourError(null);
    eventState.setShowPickerMenu((prev) => !prev);
  };

  const baseInputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500";
  const errorClass = "ring-2 ring-red-500 border-red-500";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white text-black">
      <div className="grow overflow-y-auto p-6 space-y-6">
        {eventState.submitError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {eventState.submitError}
          </div>
        ) : null}
        {eventState.clockSkewWarning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {eventState.clockSkewWarning}
          </div>
        )}

        <EventFormColour
          isColourLocked={derivedValues.isColourLocked}
          handleColourPickerToggle={handleColourPickerToggle}
          displayColour={derivedValues.displayColour}
          baseInputClass={baseInputClass}
          title={eventState.title}
          setTitle={eventState.setTitle}
        />

        <EventFormStartTime
          baseInputClass={baseInputClass}
          errors={derivedValues.errors}
          errorClass={errorClass}
          startDate={eventState.startDate}
          setStartDate={eventState.setStartDate}
          refreshValidationNow={refreshValidationNow}
          startTime={eventState.startTime}
          setStartTime={eventState.setStartTime}
        />

        <EventFormEndTime
          baseInputClass={baseInputClass}
          errors={derivedValues.errors}
          errorClass={errorClass}
          endDate={eventState.endDate}
          setEndDate={eventState.setEndDate}
          endTime={eventState.endTime}
          setEndTime={eventState.setEndTime}
        />

        {derivedValues.errors.time && (
          <p className="text-xs text-red-500 -mt-4">
            Start time must be before end time.
          </p>
        )}

        <div>
          <label
            htmlFor="event-location"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Location <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="event-location"
            className={baseInputClass}
            placeholder="Location"
            type="text"
            value={eventState.location}
            onChange={(e) => eventState.setLocation(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Category <span className="text-gray-400">(optional)</span>
          </label>
          <CategoryMultiSelect
            categories={categories}
            selectedIds={eventState.selectedCategories}
            onChange={eventState.setSelectedCategories}
            onCreateCategory={onCreateCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
            variant="event"
          />
        </div>

        <div>
          <label
            htmlFor="event-description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="event-description"
            className={`${baseInputClass} resize-none`}
            placeholder=""
            rows={3}
            value={eventState.description}
            onChange={(e) => eventState.setDescription(e.target.value)}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-transparent p-3">
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="event-recurring"
              className="text-sm font-medium text-gray-700"
            >
              Recurring
            </label>
            <button
              id="event-recurring"
              type="button"
              onClick={() => {
                const nextValue = !eventState.recurrenceEnabled;
                eventState.setRecurrenceEnabled(nextValue);

                if (!nextValue) {
                  eventState.setRecurrenceInterval(null);
                  eventState.setRecurrenceEnd("");
                } else if (!eventState.recurrenceInterval) {
                  eventState.setRecurrenceInterval("weekly");
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                eventState.recurrenceEnabled ? "bg-primary" : "bg-gray-300"
              }`}
              aria-pressed={eventState.recurrenceEnabled}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  eventState.recurrenceEnabled ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {eventState.recurrenceEnabled && (
            <EventFormRecurrence
              baseInputClass={baseInputClass}
              recurrenceInterval={eventState.recurrenceInterval}
              setRecurrenceInterval={eventState.setRecurrenceInterval}
              recurrenceEnd={eventState.recurrenceEnd}
              setRecurrenceEnd={eventState.setRecurrenceEnd}
            />
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-transparent p-3">
          <div
            className={`${
              eventState.reminders.length > 0 ? "mb-2" : ""
            } flex items-center justify-between`}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">
                Reminders ({eventState.reminders.length}/{MAX_REMINDERS})
              </h3>
              <Tooltip content="In-app notifications are always sent. Select additional channels below.">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-[10px] text-gray-500 cursor-help">
                  ?
                </span>
              </Tooltip>
            </div>

            <button
              type="button"
              onClick={eventReminderActions.addReminder}
              disabled={!canAddReminder}
              className={`text-sm font-medium flex items-center gap-1 ${
                canAddReminder
                  ? "text-orange-600 hover:text-orange-700"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="material-icons text-sm">add</span> Add Reminder
            </button>
          </div>

          <div className="space-y-2">
            {eventState.reminders.map((reminder, index) => (
              <EventFormReminder
                key={index}
                index={index}
                reminder={reminder}
                toggleReminderChannel={eventReminderActions.toggleReminderChannel}
                handleTogglePush={() => {
                  const nextValue = !reminder.send_push;
                  void eventReminderActions.handleTogglePush(index, nextValue);
                }}
                updateReminder={eventReminderActions.updateReminder}
                removeReminder={eventReminderActions.removeReminder}
                permission={permission}
                pushLoading={pushLoading}
                pastReminderIndices={pastReminderIndices}
                pushDeniedNotice={eventState.pushDeniedNotice}
              />
            ))}
          </div>
        </div>
      </div>
      <EventFormSave
        onCancel={onCancel}
        hasErrors={derivedValues.hasErrors}
        hasChanges={hasChanges}
        isSubmitting={eventState.isSubmitting}
      />
      <CategoryColourPicker
        isOpen={eventState.showPickerMenu}
        position={eventState.pickerPosition}
        pickerRef={pickerRef}
        colourInput={eventState.colourInput}
        colourError={eventState.colourError}
        currentColour={derivedValues.displayColour}
        onColourInputChange={eventState.setColourInput}
        onColourErrorChange={eventState.setColourError}
        onCommitInput={() => {
          const parsed = parseColourInput(eventState.colourInput);
          if (!parsed) {
            eventState.setColourError("Enter a valid hex or rgb colour.");
            return;
          }
          eventState.setColourInput(parsed);
        }}
        onSelect={() => {
          const parsed = parseColourInput(eventState.colourInput);
          if (!parsed) {
            eventState.setColourError("Enter a valid hex or rgb colour.");
            return;
          }
          eventState.setColour(parsed);
          eventState.setShowPickerMenu(false);
        }}
      />
    </form>
  );
};

export default EventForm;
