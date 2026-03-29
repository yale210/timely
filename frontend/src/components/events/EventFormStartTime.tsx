interface EventFormStartTimeProps {
    baseInputClass: string;
    errors: Record<string, boolean>;
    errorClass: string;
    startDate: string;
    setStartDate: (value: string) => void;
    refreshValidationNow: () => void;
    startTime: string;
    setStartTime: (value: string) => void;
}

const getDateTimeClass = (
    baseInputClass: string,
    hasError: boolean,
    errorClass: string,
) => `${baseInputClass} text-[17px] ${hasError ? errorClass : ""}`;

/**
 * Renders the start date and start time inputs for the event form.
 * @param props - The props for the start time section.
 * @param props.baseInputClass - The shared base class applied to the input fields.
 * @param props.errors - A map of validation flags for the form.
 * @param props.errorClass - The class applied when the start inputs have a validation error.
 * @param props.startDate - The current start date value.
 * @param props.setStartDate - Updates the start date value.
 * @param props.refreshValidationNow - Refreshes time-based validation before input updates.
 * @param props.startTime - The current start time value.
 * @param props.setStartTime - Updates the start time value.
 * @returns The rendered start date and time input section.
 */
export default function EventFormStartTime(props: EventFormStartTimeProps) {
    return (
    <div className="grid grid-cols-2 gap-4">
        <div>
        <label htmlFor="event-start-date" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
        </label>
        <input
            id="event-start-date"
            className={getDateTimeClass(props.baseInputClass, Boolean(props.errors.time), props.errorClass)}
            type="date"
            value={props.startDate}
            onChange={(e) => {
            props.refreshValidationNow();
            props.setStartDate(e.target.value);
            }}
            required
        />
        </div>
        <div>
        <label htmlFor="event-start-time" className="block text-sm font-medium text-gray-700 mb-2">
            Start Time
        </label>
        <input
            id="event-start-time"
            className={getDateTimeClass(props.baseInputClass, Boolean(props.errors.time), props.errorClass)}
            type="time"
            value={props.startTime}
            onChange={(e) => {
            props.refreshValidationNow();
            props.setStartTime(e.target.value);
            }}
            required
        />
        </div>
    </div>
    );
}