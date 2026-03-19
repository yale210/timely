
import AppLayout from "@/layouts/AppLayout";
import AssessmentOverview from "@/components/assessments/AssessmentOverview";
import { useAssessments } from "@/hooks/assessments/useAssessments";
import { useActionState } from "react";

/**
 * Renders the main assessment page using a thin container.
 * @returns The rendered assessment page.
 */
export default function Assessment() {
  const { state,actions } = useAssessments();

  return (
    <AppLayout>
      <AssessmentOverview
        assessments={state.assessments}
        onSubmit={actions.submitAssessment}
        onDelete={actions.deleteAssessment}
      />
    </AppLayout>
  );
}
