import type { TaskFormErrors } from "@/types";
import type { Dispatch, SetStateAction } from "react";

interface Props {
    completedMinutes: number | "";
    setCompletedMinutes: Dispatch<SetStateAction<number | "">>;
    normalizedEstimatedMinutes: number;
    progressPercent: number;
    errors: TaskFormErrors;
    errorClass: string;
}

/**
 * Renders the task progress bar and completed-minutes input.
 * @param props The component props.
 * @param props.completedMinutes The completed-minutes field value.
 * @param props.setCompletedMinutes Updates the completed-minutes field.
 * @param props.normalizedEstimatedMinutes The total estimated minutes.
 * @param props.progressPercent The calculated completion percentage.
 * @param props.errors Validation flags for the task form.
 * @param props.errorClass Error styling for invalid input.
 * @returns The task progress section.
 */
export default function TaskFormProgress(props: Props) {
    return (
        <div>
            <div className="mb-2">
                <label
                    htmlFor="task-completed-minutes"
                    className="block text-sm font-medium text-gray-700"
                >
                    Progress
                </label>
            </div>

            <div className="flex items-center gap-2">
                <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                        className="h-full rounded-full bg-primary transition-[width] duration-200"
                        style={{ width: `${props.progressPercent}%` }}
                    />
                </div>

                <input
                    id="task-completed-minutes"
                    className={`w-11 appearance-none rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-black shadow-sm focus:border-primary focus:ring-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                        props.errors.completed_minutes ? props.errorClass : ""
                    }`}
                    type="number"
                    min="0"
                    max={Math.max(0, props.normalizedEstimatedMinutes)}
                    value={props.completedMinutes}
                    onChange={(e) => {
                        const nextValue = e.target.value;
                        props.setCompletedMinutes(
                            nextValue === "" ? "" : Number.parseInt(nextValue, 10),
                        );
                    }}
                />

                <span className="text-sm font-medium text-gray-700">
                    / {props.normalizedEstimatedMinutes} mins
                </span>
            </div>

            {props.errors.completed_minutes ? (
                <p className="mt-2 text-xs text-red-500">
                    Completed minutes must be between 0 and the estimated minutes.
                </p>
            ) : null}
        </div>
    );
}