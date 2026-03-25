import { useEffect, useState } from "react";
import { hexToRgba } from "@/utils/colorUtils";
import type { Assessment, Category } from "@/types";

interface AssessmentCardProps {
  assessment: Assessment;
  onClick: (assessment: Assessment) => void;
  onAddToGradebook: (assessment: Assessment) => void;
  isGradebookEnabled: boolean;
}

const getChipStyle = (category?: Category | null) => {
  const colour = category?.colour ?? "#94a3b8";
  return {
    borderColor: colour,
    backgroundColor: hexToRgba(colour, 0.12),
  };
};

const formatCompactDateTime = (value: string): string => {
  const date = new Date(value);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCountdownLabel = (value: string, nowMs: number, isCompleted: boolean): string | null => {
  if (isCompleted) {
    return null;
  }

  const targetTime = new Date(value).getTime();
  const diffMs = targetTime - nowMs;
  if (diffMs <= 0) {
    return "Now";
  }

  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 1) {
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return `${diffHours}h left`;
  }

  return `${Math.ceil(diffDays)}d left`;
};

const getCountdownTone = (value: string, nowMs: number) => {
  const diffMs = new Date(value).getTime() - nowMs;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 3) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (diffDays < 7) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  if (diffDays < 30) {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  return "border-gray-200 bg-gray-50 text-gray-700";
};

const AssessmentCard = ({
  assessment,
  onClick,
  onAddToGradebook,
  isGradebookEnabled,
}: AssessmentCardProps) => {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const comparisonDate = assessment.linked_event_details?.end_time ?? assessment.due_date;
  const countdownDate = assessment.linked_event_details?.start_time ?? assessment.due_date;
  const isCompleted = assessment.completed || new Date(comparisonDate).getTime() < currentTime;
  const isOverdue = !isCompleted && new Date(assessment.due_date).getTime() < currentTime;
  const primaryCategory = assessment.assessment_category ?? assessment.categories[0] ?? null;
  const supplementalCategories = assessment.categories.filter((category) => (
    category.id !== assessment.assessment_category?.id && category.id !== assessment.module_category?.id
  ));
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const countdownLabel = getCountdownLabel(countdownDate, currentTime, isCompleted);
  const countdownTone = getCountdownTone(countdownDate, currentTime);
  const cardColour = assessment.module_category?.colour ?? "#e5e7eb";
  const dueItem = {
    value: assessment.linked_event_details
      ? `Due ${formatCompactDateTime(assessment.linked_event_details.start_time)}`
      : (isOverdue ? "Due Overdue" : `Due ${formatCompactDateTime(assessment.due_date)}`),
    tone: isOverdue ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50 text-gray-800",
  };
  const weightingItem = {
    value: `Weight ${assessment.weighting_of_assessment}%`,
    tone: "border-gray-200 bg-gray-50 text-gray-800",
  };

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
      className="relative rounded-2xl border px-5 pb-5 pt-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
      style={{
        borderColor: cardColour,
        backgroundColor: hexToRgba(cardColour, 0.1),
      }}
    >
      {(countdownLabel || isCompleted) ? (
        <div className="absolute right-5 top-4 flex flex-col items-end gap-2">
          {countdownLabel ? (
            <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${countdownTone}`}>
              {countdownLabel}
            </div>
          ) : null}
          {isCompleted && isGradebookEnabled ? (
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
      ) : null}

      <div className="flex flex-col gap-4">
        {isCompleted ? (
          <div className="mb-0 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Completed
            </span>
          </div>
        ) : null}

        {assessment.module_category || primaryCategory ? (
          <div className="-mb-1 flex flex-wrap gap-6">
            {assessment.module_category ? (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-600">
                  Module
                </div>
                <div className="mt-0.5 text-base font-semibold text-black">
                  {assessment.module_category.text}
                </div>
              </div>
            ) : null}
            {primaryCategory ? (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-600">
                  Type
                </div>
                <div className="mt-0.5 text-base font-semibold text-black">
                  {primaryCategory.text}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h3 className={`min-w-0 text-lg font-semibold leading-tight ${isCompleted ? "text-gray-500 line-through" : "text-black"}`}>
                {assessment.title}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className={`rounded-lg border px-3 py-2 text-xs font-semibold ${dueItem.tone}`}>
                {dueItem.value}
              </div>
              <div className={`rounded-lg border px-3 py-2 text-xs font-semibold ${weightingItem.tone}`}>
                {weightingItem.value}
              </div>
            </div>

            {assessment.notes ? (
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                {assessment.notes}
              </p>
            ) : null}
          </div>
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
