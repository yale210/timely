import type { ReminderFormState } from "@/hooks/eventForm/useEventFormTypes";
import type { PushPermission } from "@/types";
import type { TimeUnit } from "@/hooks/eventForm/useEventFormTypes";
import { UNIT_LABELS } from "@/hooks/eventForm/eventFormReminderHelpers";
interface Props {
    index: number;
    reminder: ReminderFormState;
    toggleReminderChannel: (i: number, f: "send_email" | "send_push", v: boolean) => void;
    permission: PushPermission;
    handleTogglePush: (i: number, n: boolean) => void;
    pushLoading: boolean;
    updateReminder: <K extends keyof ReminderFormState>(
        index: number,
        field: K,
        value: ReminderFormState[K],
        ) => void;
    pastReminderIndices: Set<number>;
    removeReminder: (index: number) => void;
    pushDeniedNotice: Record<number, boolean>;
}
/**
 * Renders a single reminder row within the event form.
 * @param props - The props for the reminder row.
 * @param props.index - The index of the reminder in the reminders list.
 * @param props.reminder - The reminder state being rendered.
 * @param props.toggleReminderChannel - Toggles email or popup delivery for a reminder.
 * @param props.permission - The current browser push notification permission state.
 * @param props.handleTogglePush - Handles enabling or disabling push notifications for the reminder.
 * @param props.pushLoading - Whether push subscription state is currently loading.
 * @param props.updateReminder - Updates a single field on the reminder.
 * @param props.pastReminderIndices - The set of reminder indices that would trigger in the past.
 * @param props.removeReminder - Removes the reminder at the given index.
 * @param props.pushDeniedNotice - Tracks which reminders should show a push-permission warning.
 * @returns The rendered reminder row.
 */
export default function EventFormReminder(props: Props) {
    return (
        <div key={props.index} className={`flex flex-col gap-2 rounded-lg px-3 py-2 ${props.pastReminderIndices.has(props.index) ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium">Reminder</span>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={props.reminder.send_email}
                      onChange={(e) => props.toggleReminderChannel(props.index, "send_email", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    Email
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={props.reminder.send_push}
                      disabled={props.permission === "unsupported" || props.pushLoading}
                      onChange={(e) => {
                        void props.handleTogglePush(props.index, e.target.checked);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 disabled:opacity-50"
                    />
                    Popup
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-20 text-sm border-gray-300 rounded-md bg-white px-3 focus:ring-orange-500 focus:border-orange-500"
                    value={props.reminder.value}
                    onChange={(e) => props.updateReminder(props.index, "value", parseInt(e.target.value) || 1)}
                    min="1"
                  />
                  <select
                    className="text-sm border-gray-300 rounded-md bg-white focus:ring-orange-500 focus:border-orange-500"
                    value={props.reminder.unit}
                    onChange={(e) => props.updateReminder(props.index, "unit", e.target.value as TimeUnit)}
                  >
                    {UNIT_LABELS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-500">before start</span>
                  <button
                    type="button"
                    onClick={() => props.removeReminder(props.index)}
                    className="ml-auto text-gray-400 hover:text-red-500"
                  >
                    <span className="material-icons text-sm">delete</span>
                  </button>
                </div>
                {props.pastReminderIndices.has(props.index) && (
                  <p className="text-sm text-red-600">
                    This reminder would trigger in the past.
                  </p>
                )}
                {props.pushDeniedNotice[props.index] && (
                <p className="text-sm text-red-600">
                    Browser notifications are blocked. Enable them in your browser settings to use popups.
                </p>
            )}
        </div>
    )
}