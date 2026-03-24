import { useState } from "react";

import type { Assessment } from "@/types";
import AssessmentCard from "./AssessmentCard";

interface AssessmentSectionProps {
  title: string;
  assessments: Assessment[];
  onClick: (assessment: Assessment) => void;
  onAddToGradebook: (assessment: Assessment) => void;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
}

const AssessmentSection = ({
  title,
  assessments,
  onClick,
  onAddToGradebook,
  isCollapsible = false,
  defaultCollapsed = false,
}: AssessmentSectionProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <section className="mb-8">
      <div
        className={`mb-4 flex items-center gap-2 ${isCollapsible ? "cursor-pointer select-none" : ""}`}
        onClick={() => {
          if (isCollapsible) {
            setIsCollapsed((prev) => !prev);
          }
        }}
      >
        {isCollapsible ? (
          <span className={`material-icons text-base text-gray-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}>
            expand_more
          </span>
        ) : null}
        <h2 className="text-lg font-semibold text-black">{title}</h2>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
          {assessments.length}
        </span>
      </div>

      {!isCollapsed ? (
        <div className="space-y-3">
          {assessments.length === 0 ? (
            <p className="text-sm text-gray-500">No assessments in this section.</p>
          ) : (
            assessments.map((assessment) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                onClick={onClick}
                onAddToGradebook={onAddToGradebook}
              />
            ))
          )}
        </div>
      ) : null}
    </section>
  );
};

export default AssessmentSection;
