import { Tooltip } from "@/components";
import type { ReminderFormState } from "@/hooks/eventForm/useEventFormTypes";
import type { PushPermission } from "@/types";
import EventFormRecurrence from "@/components/events/EventFormRecurrence";
import EventFormReminder from "@/components/events/EventFormReminder";

interface EventFormRecurrenceRemindersProps {
  baseInputClass: string;
  recurrenceEnabled: boolean;
  setRecurrenceEnabled: (value: boolean) => void;
  recurrenceInterval: string | null;
  setRecurrenceInterval: (value: string | null) => void;
  recurrenceEnd: string;
  setRecurrenceEnd: (value: string) => void;
  reminders: ReminderFormState[];
  maxReminders: number;
  canAddReminder: boolean;
  addReminder: () => void;
  toggleReminderChannel: (
    index: number,
    field: "send_push",
    value: boolean,
  ) => void;
  handleTogglePush: (index: number, nextValue: boolean) => Promise<void>;
  updateReminder: <K extends keyof ReminderFormState>(
    index: number,
    field: K,
    value: ReminderFormState[K],
  ) => void;
  removeReminder: (index: number) => void;
  permission: PushPermission;
  pushLoading: boolean;
  pastReminderIndices: Set<number>;
  pushDeniedNotice: Record<number, boolean>;
}

/**
 * Renders the recurrence toggle and reminder list used in the event form.
 * @param root0 Component props.
 * @param root0.baseInputClass Shared input styles.
 * @param root0.recurrenceEnabled Whether recurrence is enabled.
 * @param root0.setRecurrenceEnabled Updates the recurrence toggle.
 * @param root0.recurrenceInterval Current recurrence interval.
 * @param root0.setRecurrenceInterval Updates the recurrence interval.
 * @param root0.recurrenceEnd Current recurrence end date.
 * @param root0.setRecurrenceEnd Updates the recurrence end date.
 * @param root0.reminders Current reminder rows.
 * @param root0.maxReminders Maximum reminder count.
 * @param root0.canAddReminder Whether another reminder can be added.
 * @param root0.addReminder Adds a reminder row.
 * @param root0.toggleReminderChannel Toggles push delivery.
 * @param root0.handleTogglePush Handles push permission and push state.
 * @param root0.updateReminder Updates one reminder field.
 * @param root0.removeReminder Removes a reminder row.
 * @param root0.permission Push notification permission state.
 * @param root0.pushLoading Whether push subscription work is in flight.
 * @param root0.pastReminderIndices Reminder indices that would trigger in the past.
 * @param root0.pushDeniedNotice Reminder rows with a push-permission warning.
 * @returns The recurrence and reminder section.
 */
export default function EventFormRecurrenceReminders({
  baseInputClass,
  recurrenceEnabled,
  setRecurrenceEnabled,
  recurrenceInterval,
  setRecurrenceInterval,
  recurrenceEnd,
  setRecurrenceEnd,
  reminders,
  maxReminders,
  canAddReminder,
  addReminder,
  toggleReminderChannel,
  handleTogglePush,
  updateReminder,
  removeReminder,
  permission,
  pushLoading,
  pastReminderIndices,
  pushDeniedNotice,
}: EventFormRecurrenceRemindersProps) {
  const handleRecurrenceToggle = () => {
    const nextValue = !recurrenceEnabled;
    setRecurrenceEnabled(nextValue);

    if (!nextValue) {
      setRecurrenceInterval(null);
      setRecurrenceEnd("");
      return;
    }

    if (!recurrenceInterval) {
      setRecurrenceInterval("weekly");
    }
  };

  return (
    <>
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
            onClick={handleRecurrenceToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              recurrenceEnabled ? "bg-primary" : "bg-gray-300"
            }`}
            aria-pressed={recurrenceEnabled}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                recurrenceEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        {recurrenceEnabled ? (
          <EventFormRecurrence
            baseInputClass={baseInputClass}
            recurrenceInterval={recurrenceInterval}
            setRecurrenceInterval={setRecurrenceInterval}
            recurrenceEnd={recurrenceEnd}
            setRecurrenceEnd={setRecurrenceEnd}
          />
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-transparent p-3">
        <div
          className={`${
            reminders.length > 0 ? "mb-2" : ""
          } flex items-center justify-between`}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900">
              Reminders ({reminders.length}/{maxReminders})
            </h3>
            <Tooltip content="In-app notifications are always sent. Select additional channels below.">
              <span className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-gray-300 text-[10px] text-gray-500">
                ?
              </span>
            </Tooltip>
          </div>

          <button
            type="button"
            onClick={addReminder}
            disabled={!canAddReminder}
            className={`flex items-center gap-1 text-sm font-medium ${
              canAddReminder
                ? "text-orange-600 hover:text-orange-700"
                : "cursor-not-allowed text-gray-400"
            }`}
          >
            <span className="material-icons text-sm">add</span> Add Reminder
          </button>
        </div>

        <div className="space-y-2">
          {reminders.map((reminder, index) => (
            <EventFormReminder
              key={index}
              index={index}
              reminder={reminder}
              toggleReminderChannel={toggleReminderChannel}
              handleTogglePush={(i, nextValue) =>
                void handleTogglePush(i, nextValue)
              }
              updateReminder={updateReminder}
              removeReminder={removeReminder}
              permission={permission}
              pushLoading={pushLoading}
              pastReminderIndices={pastReminderIndices}
              pushDeniedNotice={pushDeniedNotice}
            />
          ))}
        </div>
      </div>
    </>
  );
}
