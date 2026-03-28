import { Tooltip } from "@/components";
import type { Dispatch, SetStateAction } from "react";
import type { TaskFormErrors } from "@/types";

interface Props {
    bufferEnabled: boolean;
    setBufferEnabled: Dispatch<SetStateAction<boolean>>;
    baseInputClass: string;
    errorClass: string;
    errors: TaskFormErrors;
    bufferBeforeMinutes: string;
    setBufferBeforeMinutes: Dispatch<SetStateAction<string>>;
    bufferAfterMinutes: string;
    setBufferAfterMinutes: Dispatch<SetStateAction<string>>;
}

/**
 * Renders the scheduling buffer controls for the task form.
 * @param props The component props.
 * @param props.bufferEnabled Whether scheduling buffers are enabled.
 * @param props.setBufferEnabled Updates the scheduling buffer toggle.
 * @param props.baseInputClass Base styling for the inputs.
 * @param props.errorClass Error styling for invalid inputs.
 * @param props.errors Validation flags for the buffer inputs.
 * @param props.bufferBeforeMinutes The buffer before value in minutes.
 * @param props.setBufferBeforeMinutes Updates the buffer before value.
 * @param props.bufferAfterMinutes The buffer after value in minutes.
 * @param props.setBufferAfterMinutes Updates the buffer after value.
 * @returns The scheduling buffer section of the task form.
 */
export default function TaskFormErrorBuffers({
    bufferEnabled,
    setBufferEnabled,
    baseInputClass,
    errorClass,
    errors,
    bufferBeforeMinutes,
    setBufferBeforeMinutes,
    bufferAfterMinutes,
    setBufferAfterMinutes,
}: Props) {
    return (
        <div className="rounded-xl border border-gray-200 bg-transparent p-3">
        <div className={`${bufferEnabled ? "mb-2" : ""} flex items-center justify-between gap-4`}>
            <div className="flex items-center gap-2">
            <label htmlFor="task-buffer-enabled" className="block text-sm font-medium text-gray-700">
                Scheduling Buffer
            </label>
            <Tooltip content="Reserves extra time before and after this task so the scheduler leaves a gap around it.">
                <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-100"
                aria-label="Explain scheduling buffer"
                >
                ?
                </button>
            </Tooltip>
            </div>

            <button
            id="task-buffer-enabled"
            type="button"
            onClick={() => setBufferEnabled((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                bufferEnabled ? "bg-primary" : "bg-gray-300"
            }`}
            aria-pressed={bufferEnabled}
            >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                bufferEnabled ? "translate-x-5" : "translate-x-1"
                }`}
            />
            </button>
        </div>

        {bufferEnabled ? (
            <div className="space-y-3">
            <div className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3">
                <label htmlFor="task-buffer-before-minutes" className="min-w-0 text-sm font-medium text-gray-700">
                Buffer before (mins)
                </label>
                <input
                id="task-buffer-before-minutes"
                className={`${baseInputClass} ${errors.buffer_before_minutes ? errorClass : ""}`}
                type="number"
                min="0"
                max="240"
                step="5"
                value={bufferBeforeMinutes}
                onChange={(e) => {
                    setBufferBeforeMinutes(e.target.value);
                }}
                />
                {errors.buffer_before_minutes ? (
                <p className="col-span-2 text-xs text-red-500">
                    Buffer before must be between 0 and 240 minutes.
                </p>
                ) : null}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3">
                <label htmlFor="task-buffer-after-minutes" className="min-w-0 text-sm font-medium text-gray-700">
                Buffer after (mins)
                </label>
                <input
                id="task-buffer-after-minutes"
                className={`${baseInputClass} ${errors.buffer_after_minutes ? errorClass : ""}`}
                type="number"
                min="0"
                max="240"
                step="5"
                value={bufferAfterMinutes}
                onChange={(e) => {
                    setBufferAfterMinutes(e.target.value);
                }}
                />
                {errors.buffer_after_minutes ? (
                <p className="col-span-2 text-xs text-red-500">
                    Buffer after must be between 0 and 240 minutes.
                </p>
                ) : null}
            </div>
            </div>
        ) : null}
        </div>
    );
}