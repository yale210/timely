import type { TaskFormErrors } from "@/types";

interface Props {
    baseInputClass: string;
    errorClass: string;
    errors: TaskFormErrors;
    date: string;
    setDate: (value: string) => void;
    startTime: string;
    setStartTime: (value: string) => void;
    setHasTouchedTime: (value: boolean) => void;
}

function getInputClass(
    baseInputClass: string,
    hasError: boolean | undefined,
    errorClass: string,
) {
    return `${baseInputClass} text-[17px] ${hasError ? errorClass : ""}`;
}

/**
 * Renders the start date and start time inputs for the task form.
 * @param props The component props.
 * @param props.baseInputClass Base styling for the date and time inputs.
 * @param props.errorClass Error styling applied when the start time is invalid.
 * @param props.errors Validation flags for the task form.
 * @param props.date The selected start date value.
 * @param props.setDate Updates the selected start date.
 * @param props.startTime The selected start time value.
 * @param props.setStartTime Updates the selected start time.
 * @param props.setHasTouchedTime Marks the time fields as touched for validation.
 * @returns The start date and time section of the task form.
 */
export default function TaskFormStartTime({
    baseInputClass,
    errorClass,
    errors,
    date,
    setDate,
    startTime,
    setStartTime,
    setHasTouchedTime,
}: Props) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label
                    htmlFor="task-start-date"
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    Start Date
                </label>
                <input
                    id="task-start-date"
                    type="date"
                    value={date}
                    className={getInputClass(baseInputClass, errors.start, errorClass)}
                    onChange={(e) => {
                        setHasTouchedTime(true);
                        setDate(e.target.value);
                    }}
                    required
                />
            </div>

            <div>
                <label
                    htmlFor="task-start-time"
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    Start Time
                </label>
                <input
                    id="task-start-time"
                    type="time"
                    value={startTime}
                    className={getInputClass(baseInputClass, errors.start, errorClass)}
                    onChange={(e) => {
                        setHasTouchedTime(true);
                        setStartTime(e.target.value);
                    }}
                    required
                />
            </div>
        </div>
    );
}