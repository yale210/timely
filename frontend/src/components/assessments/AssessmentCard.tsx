import { hexToRgba } from "@/utils/colorUtils";
import type { Assessment, Category } from "@/types";

interface AssessmentCardProps {
  assessment: Assessment;
  onClick: (assessment: Assessment) => void;
  onToggleCompleted: (assessment: Assessment) => void;
  onAddToGradebook: (assessment: Assessment) => void;
}

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getChipStyle = (category?: Category | null) => {
  const colour = category?.colour ?? "#94a3b8";
  return {
    borderColor: colour,
    backgroundColor: hexToRgba(colour, 0.12),
  };
};

const AssessmentCard = ({
  assessment,
  onClick,
  onToggleCompleted,
  onAddToGradebook,
}: AssessmentCardProps) => {
  const isOverdue = !assessment.completed && new Date(assessment.due_date).getTime() < Date.now();
  const primaryCategory = assessment.assessment_category ?? assessment.categories[0] ?? null;
  const supplementalCategories = assessment.categories.filter((category) => (
    category.id !== assessment.assessment_category?.id && category.id !== assessment.module_category?.id
  ));

  const statItems = [
    {
      label: assessment.linked_event_details ? "Starts" : "Due",
      value: assessment.linked_event_details
        ? formatDateTime(assessment.linked_event_details.start_time)
        : (isOverdue ? "Overdue" : formatDateTime(assessment.due_date)),
      tone: isOverdue ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50 text-gray-800",
    },
    {
      label: "Weighting",
      value: `${assessment.weighting_of_assessment}%`,
      tone: "border-blue-200 bg-blue-50 text-blue-800",
    },
    {
      label: "Duration",
      value: typeof assessment.length_of_assessment === "number" ? `${assessment.length_of_assessment} min` : "Not set",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    {
      label: "Mode",
      value: assessment.linked_event_details ? "Event" : "Deadline",
      tone: "border-orange-200 bg-orange-50 text-orange-800",
    },
  ];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(assessment)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(assessment);
        }
      }}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {primaryCategory ? (
                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold text-black"
                  style={getChipStyle(primaryCategory)}
                >
                  {primaryCategory.text}
                </span>
              ) : null}
              {assessment.module_category ? (
                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold text-black"
                  style={getChipStyle(assessment.module_category)}
                >
                  {assessment.module_category.text}
                </span>
              ) : null}
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                assessment.completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
              }`}>
                {assessment.completed ? "Completed" : "Active"}
              </span>
            </div>

            <h3 className={`text-lg font-semibold leading-tight ${assessment.completed ? "text-gray-500 line-through" : "text-black"}`}>
              {assessment.title}
            </h3>

            {assessment.notes ? (
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                {assessment.notes}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void onToggleCompleted(assessment);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-gray-50"
            >
              {assessment.completed ? "Mark active" : "Mark complete"}
            </button>
            {assessment.completed ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onAddToGradebook(assessment);
                }}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-300"
              >
                Add to gradebook
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statItems.map((item) => (
            <div key={item.label} className={`rounded-xl border px-4 py-3 ${item.tone}`}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-75">
                {item.label}
              </div>
              <div className="mt-2 text-sm font-semibold">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {supplementalCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {supplementalCategories.map((category) => (
              <span
                key={category.id}
                className="rounded-md border px-2.5 py-1 text-xs font-semibold text-black"
                style={getChipStyle(category)}
              >
                {category.text}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AssessmentCard;
