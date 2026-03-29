import type { Dispatch, SetStateAction } from "react";
import type { TaskFormErrors } from "@/types";

interface Props {
    baseInputClass: string;
    errorClass: string;
    errors: TaskFormErrors;
    importance: number;
    setImportance: Dispatch<SetStateAction<number>>;
    estimatedMinutes: number | "";
    setEstimatedMinutes: Dispatch<SetStateAction<number | "">>;
}

/**
 * Renders the importance and estimated minutes inputs for the task form.
 * @param props The component props.
 * @param props.baseInputClass Base styling for the inputs.
 * @param props.errorClass Error styling for invalid inputs.
 * @param props.errors Validation flags for the form.
 * @param props.importance The current importance value.
 * @param props.setImportance Updates the importance value.
 * @param props.estimatedMinutes The current estimated minutes value.
 * @param props.setEstimatedMinutes Updates the estimated minutes value.
 * @returns The importance and estimated minutes section of the task form.
 */
export default function TaskFormMinutes({
    baseInputClass,
    errorClass,
    errors,
    importance,
    setImportance,
    estimatedMinutes,
    setEstimatedMinutes,
}: Props) {
    return (
        <div className="space-y-3">
        <div className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3">
            <label htmlFor="task-importance" className="min-w-0 text-sm font-medium text-gray-700">
            Importance (1-10)
            </label>
            <input
            id="task-importance"
            className={`${baseInputClass} ${errors.importance ? errorClass : ""}`}
            type="number"
            min="1"
            max="10"
            value={importance}
            onChange={(e) => {
                const nextValue = Number.parseInt(e.target.value, 10);
                setImportance(Number.isNaN(nextValue) ? 0 : nextValue);
            }}
            />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3">
            <label htmlFor="task-minutes" className="min-w-0 text-sm font-medium text-gray-700">
            Est. Minutes
            </label>
            <input
            id="task-minutes"
            className={baseInputClass}
            type="number"
            min="1"
            value={estimatedMinutes}
            onChange={(e) => {
                const nextValue = e.target.value;
                setEstimatedMinutes(nextValue ? Number.parseInt(nextValue, 10) : "");
            }}
            required
            />
        </div>
        </div>
    );
}