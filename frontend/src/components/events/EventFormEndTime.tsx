interface EventFormEndTimeProps {
    baseInputClass: string;
    errors: Record<string, boolean>;
    errorClass: string;
    endDate: string;
    setEndDate: (value: string) => void;
    endTime: string;
    setEndTime: (value: string) => void;
};

const getDateTimeClass = (
    baseInputClass: string,
    hasError: boolean,
    errorClass: string,
) => `${baseInputClass} text-[17px] ${hasError ? errorClass : ""}`;

/**
 * Renders the end date and end time inputs for the event form.
 * @param root0 - The props for the end time section.
 * @param root0.baseInputClass - The shared base class applied to the input fields.
 * @param root0.errors - A map of validation flags for the form.
 * @param root0.errorClass - The class applied when the end inputs have a validation error.
 * @param root0.endDate - The current end date value.
 * @param root0.setEndDate - Updates the end date value.
 * @param root0.endTime - The current end time value.
 * @param root0.setEndTime - Updates the end time value.
 * @returns The rendered end date and time input section.
 */
export default function EventFormEndTime({
    baseInputClass,
    errors,
    errorClass,
    endDate,
    setEndDate,
    endTime,
    setEndTime,
}: EventFormEndTimeProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div>
            <label htmlFor="event-end-date" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
            </label>
            <input
                id="event-end-date"
                className={getDateTimeClass(baseInputClass, Boolean(errors.time), errorClass)}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
            />
            </div>
            <div>
            <label htmlFor="event-end-time" className="block text-sm font-medium text-gray-700 mb-2">
                End Time
            </label>
            <input
                id="event-end-time"
                className={getDateTimeClass(baseInputClass, Boolean(errors.time), errorClass)}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
            />
            </div>
        </div>
    );
}