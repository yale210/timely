import type { TaskFormErrors } from "@/types";

interface Props {
    baseInputClass: string;
    errorClass: string;
    errors: TaskFormErrors;
    deadline: string;
    setDeadline: (value: string) => void;
    deadlineTime: string;
    setDeadlineTime: (value: string) => void;
    setHasTouchedTime: (value: boolean) => void;
}

const getInputClass = (
    baseInputClass: string,
    hasError: boolean | undefined,
    errorClass: string,
) => `${baseInputClass} text-[17px] ${hasError ? errorClass : ""}`;

/**
 * Renders the deadline date and time controls for the task form.
 * @param props The component props.
 * @param props.baseInputClass Base styling for the inputs.
 * @param props.errorClass Error styling for invalid inputs.
 * @param props.errors Validation flags for the form.
 * @param props.deadline The selected deadline date.
 * @param props.setDeadline Updates the deadline date.
 * @param props.deadlineTime The selected deadline time.
 * @param props.setDeadlineTime Updates the deadline time.
 * @param props.setHasTouchedTime Marks the time fields as touched for validation.
 * @returns The deadline section of the task form.
 */
export default function TaskFormDeadline({
    baseInputClass,
    errorClass,
    errors,
    deadline,
    setDeadline,
    deadlineTime,
    setDeadlineTime,
    setHasTouchedTime,
}: Props) {
    return (
        <div className="grid grid-cols-2 gap-4">
        <div>
            <label
            htmlFor="task-deadline-date"
            className="mb-2 block text-sm font-medium text-gray-700"
            >
            Deadline Date
            </label>
            <input
            id="task-deadline-date"
            type="date"
            value={deadline}
            className={getInputClass(baseInputClass, errors.deadline, errorClass)}
            onChange={(e) => {
                setHasTouchedTime(true);
                setDeadline(e.target.value);
            }}
            />
        </div>

        <div>
            <label
            htmlFor="task-deadline-time"
            className="mb-2 block text-sm font-medium text-gray-700"
            >
            Deadline Time
            </label>
            <input
            id="task-deadline-time"
            type="time"
            value={deadlineTime}
            className={getInputClass(baseInputClass, errors.deadline, errorClass)}
            onChange={(e) => {
                setHasTouchedTime(true);
                setDeadlineTime(e.target.value);
            }}
            />
        </div>
        </div>
    );
}