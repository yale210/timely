import { Tooltip } from "@/components";
import type { Dispatch, SetStateAction } from "react";
import type { TaskFormErrors } from "@/types";

interface Props {
    allowSplit: boolean;
    setAllowSplit: Dispatch<SetStateAction<boolean>>;
    baseInputClass: string;
    errorClass: string;
    minSplitMinutes: string;
    setMinSplitMinutes: Dispatch<SetStateAction<string>>;
    maxSplitMinutes: string;
    setMaxSplitMinutes: Dispatch<SetStateAction<string>>;
    errors: TaskFormErrors;
}

/**
 * Renders the split-task controls for the task form.
 * @param props The component props.
 * @param props.allowSplit Whether split scheduling is enabled.
 * @param props.setAllowSplit Updates the split scheduling toggle.
 * @param props.baseInputClass Base styling for numeric inputs.
 * @param props.errorClass Error styling for invalid inputs.
 * @param props.minSplitMinutes The minimum split block length in minutes.
 * @param props.setMinSplitMinutes Updates the minimum split block length.
 * @param props.maxSplitMinutes The optional maximum split block length in minutes.
 * @param props.setMaxSplitMinutes Updates the maximum split block length.
 * @param props.errors Validation flags for the split inputs.
 * @returns The split scheduling section of the task form.
 */
export default function TaskFormSplitter({
    allowSplit,
    setAllowSplit,
    baseInputClass,
    errorClass,
    minSplitMinutes,
    setMinSplitMinutes,
    maxSplitMinutes,
    setMaxSplitMinutes,
    errors,
}: Props) {
    return (
        <div className="rounded-xl border border-gray-200 bg-transparent p-3">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <label
                        htmlFor="task-allow-split"
                        className="text-sm font-medium text-gray-700"
                    >
                        Splittable
                    </label>
                    <Tooltip content="Allows the scheduler to break this task into multiple smaller sessions instead of scheduling it as one continuous block.">
                        <button
                            type="button"
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-100"
                            aria-label="Explain splittable"
                        >
                            ?
                        </button>
                    </Tooltip>
                </div>

                <button
                    id="task-allow-split"
                    type="button"
                    onClick={() => setAllowSplit((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        allowSplit ? "bg-primary" : "bg-gray-300"
                    }`}
                    aria-pressed={allowSplit}
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                            allowSplit ? "translate-x-5" : "translate-x-1"
                        }`}
                    />
                </button>
            </div>

            {allowSplit ? (
                <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3">
                        <label
                            htmlFor="task-min-split-minutes"
                            className="min-w-0 text-sm font-medium text-gray-700"
                        >
                            Minimum split block minutes
                        </label>
                        <input
                            id="task-min-split-minutes"
                            className={`${baseInputClass} ${
                                errors.min_split_minutes ? errorClass : ""
                            }`}
                            type="number"
                            min="15"
                            max="240"
                            step="5"
                            value={minSplitMinutes}
                            onChange={(e) => {
                                setMinSplitMinutes(e.target.value);
                            }}
                        />
                        {errors.min_split_minutes ? (
                            <p className="col-span-2 text-xs text-red-500">
                                Minimum split block minutes must be between 15 and 240.
                            </p>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3">
                        <label
                            htmlFor="task-max-split-minutes"
                            className="min-w-0 text-sm font-medium text-gray-700"
                        >
                            Maximum split block minutes{" "}
                            <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            id="task-max-split-minutes"
                            className={`${baseInputClass} ${
                                errors.max_split_minutes ? errorClass : ""
                            }`}
                            type="number"
                            min="15"
                            max="1440"
                            step="5"
                            value={maxSplitMinutes}
                            onChange={(e) => {
                                setMaxSplitMinutes(e.target.value);
                            }}
                        />
                        {errors.max_split_minutes ? (
                            <p className="col-span-2 text-xs text-red-500">
                                Maximum split block minutes must be between 15 and 1440, and at least the minimum split block minutes.
                            </p>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}