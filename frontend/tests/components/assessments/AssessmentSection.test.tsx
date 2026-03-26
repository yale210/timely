import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import AssessmentSection from "@/components/assessments/AssessmentSection";
import type { Assessment } from "@/types";

vi.mock("@/components/assessments/AssessmentCard", () => ({
  default: ({
    assessment,
    onClick,
    onAddToGradebook,
  }: {
    assessment: { title: string };
    onClick: (assessment: { title: string }) => void;
    onAddToGradebook: (assessment: { title: string }) => void;
    isGradebookEnabled: boolean;
  }) => (
    <div>
      <span>{assessment.title}</span>
      <button type="button" onClick={() => onClick(assessment)}>
        Open {assessment.title}
      </button>
      <button type="button" onClick={() => onAddToGradebook(assessment)}>
        Gradebook {assessment.title}
      </button>
    </div>
  ),
}));

const buildAssessment = (id: number, title: string): Assessment => ({
  id,
  title,
  assessment_type: "OTHER",
  due_date: "2026-01-01T12:00:00Z",
  length_of_assessment: null,
  weighting_of_assessment: 20,
  notes: "",
  reminder_offset: null,
  assessment_category: null,
  module_category: null,
  categories: [],
  completed: false,
  linked_event: null,
  linked_event_details: null,
  created_at: "2025-12-01T09:00:00Z",
  updated_at: "2025-12-01T09:00:00Z",
});

describe("AssessmentSection", () => {
  it("renders the empty state when no assessments are present", () => {
    render(
      <AssessmentSection
        title="Upcoming"
        assessments={[]}
        onClick={vi.fn()}
        onAddToGradebook={vi.fn()}
        isGradebookEnabled
      />,
    );

    expect(screen.getByRole("heading", { name: "Upcoming" })).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("No assessments in this section.")).toBeInTheDocument();
  });

  it("renders assessment cards and forwards actions", () => {
    const onClick = vi.fn();
    const onAddToGradebook = vi.fn();
    const assessment = buildAssessment(1, "Databases");

    render(
      <AssessmentSection
        title="Completed"
        assessments={[assessment]}
        onClick={onClick}
        onAddToGradebook={onAddToGradebook}
        isGradebookEnabled
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Databases" }));
    fireEvent.click(screen.getByRole("button", { name: "Gradebook Databases" }));

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(onClick).toHaveBeenCalledWith(assessment);
    expect(onAddToGradebook).toHaveBeenCalledWith(assessment);
  });

  it("toggles collapsible sections", () => {
    render(
      <AssessmentSection
        title="Overdue"
        assessments={[buildAssessment(2, "Project demo")]}
        onClick={vi.fn()}
        onAddToGradebook={vi.fn()}
        isGradebookEnabled
        isCollapsible
        defaultCollapsed
      />,
    );

    expect(screen.queryByText("Project demo")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("heading", { name: "Overdue" }).parentElement!);
    expect(screen.getByText("Project demo")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("heading", { name: "Overdue" }).parentElement!);
    expect(screen.queryByText("Project demo")).not.toBeInTheDocument();
  });
});
