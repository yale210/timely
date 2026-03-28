interface EventFormRecurrenceProps {
    baseInputClass: string;
    recurrenceInterval: string | null;
    setRecurrenceInterval: (value: string | null) => void;
    recurrenceEnd: string;
    setRecurrenceEnd: (value: string) => void;
};

const getNextMonthDate = () => {
    const value = new Date();
    value.setMonth(value.getMonth() + 1);
    return value.toISOString().split("T")[0];
};

const handleEndTypeChange = (
    value: string,
    setRecurrenceEnd: (next: string) => void,
) => {
    if (value === "never") {
        setRecurrenceEnd("");
        return;
    }
    setRecurrenceEnd(getNextMonthDate());
};

/**
 * Renders the recurrence controls for the event form.
 * @param root0 - The props for the recurrence section.
 * @param root0.baseInputClass - The shared base class applied to the recurrence inputs.
 * @param root0.recurrenceInterval - The currently selected recurrence interval.
 * @param root0.setRecurrenceInterval - Updates the recurrence interval value.
 * @param root0.recurrenceEnd - The selected recurrence end date, or an empty string when the event never ends.
 * @param root0.setRecurrenceEnd - Updates the recurrence end date value.
 * @returns The rendered recurrence controls.
 */
export default function EventFormRecurrence({
    baseInputClass,
    recurrenceInterval,
    setRecurrenceInterval,
    recurrenceEnd,
    setRecurrenceEnd,
}: EventFormRecurrenceProps) {
    return (
        <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
            <label htmlFor="recurrence-interval" className="block text-sm font-medium text-gray-700 mb-2">
                Interval
            </label>
            <select
                id="recurrence-interval"
                className={baseInputClass}
                value={recurrenceInterval ?? "weekly"}
                onChange={(e) => {
                const value = e.target.value || null;
                setRecurrenceInterval(value);
                if (!value) setRecurrenceEnd("");
                }}
            >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
            </select>
            </div>
            <div>
            <label htmlFor="recurrence-end-type" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
            </label>
            <select
                id="recurrence-end-type"
                className={`${baseInputClass} mb-2`}
                value={recurrenceEnd ? "date" : "never"}
                onChange={(e) => handleEndTypeChange(e.target.value, setRecurrenceEnd)}
            >
                <option value="never">Never</option>
                <option value="date">On Date</option>
            </select>
            {recurrenceEnd && (
                <input
                id="recurrence-end"
                className={baseInputClass}
                type="date"
                value={recurrenceEnd}
                onChange={(e) => setRecurrenceEnd(e.target.value)}
                />
            )}
            </div>
        </div>
    );
}