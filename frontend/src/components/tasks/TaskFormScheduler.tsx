import { Tooltip } from "@/components";
import type { Dispatch, SetStateAction } from "react";

interface Props {
    autoSchedule: boolean;
    setAutoSchedule: Dispatch<SetStateAction<boolean>>;
    setIsTaskLocked: Dispatch<SetStateAction<boolean>>;
}

/**
 * Renders the auto-schedule toggle for the task form.
 * @param props The component props.
 * @param props.autoSchedule Whether auto-scheduling is currently enabled.
 * @param props.setAutoSchedule Updates the auto-schedule state.
 * @param props.setIsTaskLocked Updates the locked state stored in the task submission.
 * @returns The auto-schedule section of the task form.
 */
export default function TaskFormScheduler({
    autoSchedule,
    setAutoSchedule,
    setIsTaskLocked,
}: Props) {
    return (
        <div className="rounded-xl border border-gray-200 bg-transparent p-3">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <label
                        htmlFor="task-auto-schedule"
                        className="text-sm font-medium text-gray-700"
                    >
                        Auto-schedule
                    </label>
                    <Tooltip content="Automatically includes this task in scheduling and rescheduling. Turn this off to keep it out of auto-allocation.">
                        <button
                            type="button"
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-100"
                            aria-label="Explain auto-schedule"
                        >
                            ?
                        </button>
                    </Tooltip>
                </div>

                <button
                    id="task-auto-schedule"
                    type="button"
                    onClick={() => {
                        setAutoSchedule((prev) => {
                            const nextValue = !prev;
                            setIsTaskLocked(!nextValue);
                            return nextValue;
                        });
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoSchedule ? "bg-primary" : "bg-gray-300"
                    }`}
                    aria-pressed={autoSchedule}
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                            autoSchedule ? "translate-x-5" : "translate-x-1"
                        }`}
                    />
                </button>
            </div>
        </div>
    );
}