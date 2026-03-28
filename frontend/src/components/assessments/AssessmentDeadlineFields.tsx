interface AssessmentDeadlineFieldsProps {
  dueDate: string;
  weighting: number | "";
  inputClassName: string;
  onDueDateChange: (value: string) => void;
  onWeightingChange: (value: number | "") => void;
}

const AssessmentDeadlineFields = ({
  dueDate,
  weighting,
  inputClassName,
  onDueDateChange,
  onWeightingChange,
}: AssessmentDeadlineFieldsProps) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <div>
      <label htmlFor="assessment-due-date" className="mb-2 block text-sm font-medium text-gray-700">
        Due date
      </label>
      <input
        id="assessment-due-date"
        type="datetime-local"
        value={dueDate}
        onChange={(event) => onDueDateChange(event.target.value)}
        className={inputClassName}
        required
      />
    </div>
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
  </div>
);

export default AssessmentDeadlineFields;
