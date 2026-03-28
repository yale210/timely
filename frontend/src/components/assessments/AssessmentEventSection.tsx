interface AssessmentEventSectionProps {
  weighting: number | "";
  eventStart: string;
  eventEnd: string;
  eventLocation: string;
  inputClassName: string;
  onWeightingChange: (value: number | "") => void;
  onEventStartChange: (value: string) => void;
  onEventEndChange: (value: string) => void;
  onEventLocationChange: (value: string) => void;
}

const AssessmentEventSection = ({
  weighting,
  eventStart,
  eventEnd,
  eventLocation,
  inputClassName,
  onWeightingChange,
  onEventStartChange,
  onEventEndChange,
  onEventLocationChange,
}: AssessmentEventSectionProps) => (
  <div className="rounded-xl border border-gray-200 px-4 py-3">
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-medium text-gray-900">Event details</p>
      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
        Event
      </span>
    </div>

    <div className="mt-4 grid gap-4">
      <div>
        <label htmlFor="assessment-weighting" className="mb-2 block text-sm font-medium text-gray-700">
          Weighting %
        </label>
        <input
          id="assessment-weighting"
          type="number"
          min="0"
          max="100"
          value={String(weighting)}
          onChange={(event) => onWeightingChange(event.target.value === "" ? "" : Number(event.target.value))}
          className={inputClassName}
          placeholder="Optional"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="assessment-event-start" className="mb-2 block text-sm font-medium text-gray-700">
            Start
          </label>
          <input
            id="assessment-event-start"
            type="datetime-local"
            value={eventStart}
            onChange={(event) => onEventStartChange(event.target.value)}
            className={inputClassName}
            required
          />
        </div>
        <div>
          <label htmlFor="assessment-event-end" className="mb-2 block text-sm font-medium text-gray-700">
            End
          </label>
          <input
            id="assessment-event-end"
            type="datetime-local"
            value={eventEnd}
            onChange={(event) => onEventEndChange(event.target.value)}
            className={inputClassName}
            required
          />
        </div>
      </div>
      <div>
        <label htmlFor="assessment-event-location" className="mb-2 block text-sm font-medium text-gray-700">
          Location
        </label>
        <input
          id="assessment-event-location"
          value={eventLocation}
          onChange={(event) => onEventLocationChange(event.target.value)}
          className={inputClassName}
          placeholder="Optional location"
        />
      </div>
    </div>
  </div>
);

export default AssessmentEventSection;
