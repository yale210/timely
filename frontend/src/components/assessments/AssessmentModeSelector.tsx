import type { AssessmentMode } from "@/components/assessments/assessmentModalUtils";

interface AssessmentModeSelectorProps {
  mode: AssessmentMode;
  onChange: (mode: AssessmentMode) => void;
}

const options: {
  value: AssessmentMode;
  label: string;
  description: string;
}[] = [
  {
    value: "DEADLINE",
    label: "Deadline assessment",
    description: "Tracked by due date only.",
  },
  {
    value: "EVENT",
    label: "Event assessment",
    description: "Scheduled with a calendar event.",
  },
];

const AssessmentModeSelector = ({ mode, onChange }: AssessmentModeSelectorProps) => (
  <div className="rounded-xl border border-gray-200 p-2">
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const isActive = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              isActive
                ? "border-primary bg-blue-50 text-black"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="text-sm font-semibold">{option.label}</div>
            <div className="mt-1 text-xs text-gray-500">{option.description}</div>
          </button>
        );
      })}
    </div>
  </div>
);

export default AssessmentModeSelector;
