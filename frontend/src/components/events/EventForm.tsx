import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { CategoryColourPicker, CategoryMultiSelect } from "@/components";
import { usePushSubscription } from "@/hooks/notifications/usePushSubscription";
import type { EventFormProps, NormalisedEventSubmission } from "@/hooks/eventForm/useEventFormTypes";
import type { EventSubmission } from "@/types";
import { getEventFormHandlers } from "@/hooks/eventForm/useEventFormHandlers";
import EventFormSave from "@/components/events/EventFormSave";
import EventFormColour from "@/components/events/EventFormColour";
import EventFormStartTime from "@/components/events/EventFormStartTime";
import EventFormEndTime from "@/components/events/EventFormEndTime";
import EventFormRecurrenceReminders from "@/components/events/EventFormRecurrenceReminders";
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

        <EventFormRecurrenceReminders
          baseInputClass={baseInputClass}
          recurrenceEnabled={eventState.recurrenceEnabled}
          setRecurrenceEnabled={eventState.setRecurrenceEnabled}
          recurrenceInterval={eventState.recurrenceInterval}
          setRecurrenceInterval={eventState.setRecurrenceInterval}
          recurrenceEnd={eventState.recurrenceEnd}
          setRecurrenceEnd={eventState.setRecurrenceEnd}
          reminders={eventState.reminders}
          maxReminders={MAX_REMINDERS}
          canAddReminder={canAddReminder}
          addReminder={eventReminderActions.addReminder}
          toggleReminderChannel={eventReminderActions.toggleReminderChannel}
          handleTogglePush={eventReminderActions.handleTogglePush}
          updateReminder={eventReminderActions.updateReminder}
          removeReminder={eventReminderActions.removeReminder}
          permission={permission}
          pushLoading={pushLoading}
          pastReminderIndices={pastReminderIndices}
          pushDeniedNotice={eventState.pushDeniedNotice}
        />
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
