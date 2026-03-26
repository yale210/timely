import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import AssessmentCard from "@/components/assessments/AssessmentCard";
import type { Assessment, Category } from "@/types";

const moduleCategory: Category = { id: 1, text: "COMP101", colour: "#2563eb" };
const assessmentCategory: Category = { id: 2, text: "Exam", colour: "#f97316" };
const extraCategory: Category = { id: 3, text: "Closed book", colour: "#22c55e" };

const buildAssessment = (overrides: Partial<Assessment> = {}): Assessment => ({
  id: 1,
  title: "Networks Exam",
  assessment_type: "EXAM",
  due_date: "2026-01-01T12:00:00Z",
  length_of_assessment: null,
  weighting_of_assessment: 25,
  notes: "Bring calculator",
  reminder_offset: null,
  assessment_category: assessmentCategory,
  module_category: moduleCategory,
  categories: [assessmentCategory, moduleCategory, extraCategory],
  completed: false,
  linked_event: null,
  linked_event_details: null,
  created_at: "2025-12-01T09:00:00Z",
  updated_at: "2025-12-15T09:00:00Z",
  ...overrides,
});

describe("AssessmentCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders assessment details and forwards click and keyboard interactions", () => {
    const onClick = vi.fn();
    const onAddToGradebook = vi.fn();
    const assessment = buildAssessment();

    render(
      <AssessmentCard
        assessment={assessment}
        onClick={onClick}
        onAddToGradebook={onAddToGradebook}
        isGradebookEnabled
      />,
    );

    const card = screen.getByRole("button");

    expect(screen.getByText("Networks Exam")).toBeInTheDocument();
    expect(screen.getByText("COMP101")).toBeInTheDocument();
    expect(screen.getByText("Exam")).toBeInTheDocument();
    expect(screen.getByText("Weight 25%")).toBeInTheDocument();
    expect(screen.getByText("Bring calculator")).toBeInTheDocument();
    expect(screen.getByText("2h left")).toBeInTheDocument();
    expect(screen.getByText("Closed book")).toBeInTheDocument();

    fireEvent.click(card);
    fireEvent.keyDown(card, { key: "Enter" });

    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onClick).toHaveBeenCalledWith(assessment);
    expect(onAddToGradebook).not.toHaveBeenCalled();
  });

  it("shows the gradebook action for completed assessments and stops propagation", () => {
    const onClick = vi.fn();
    const onAddToGradebook = vi.fn();
    const assessment = buildAssessment({
      completed: true,
      due_date: "2025-12-31T08:00:00Z",
    });

    render(
      <AssessmentCard
        assessment={assessment}
        onClick={onClick}
        onAddToGradebook={onAddToGradebook}
        isGradebookEnabled
      />,
    );

    const addButton = screen.getByRole("button", { name: "Add to gradebook" });

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.queryByText(/left$/)).not.toBeInTheDocument();

    fireEvent.click(addButton);

    expect(onAddToGradebook).toHaveBeenCalledWith(assessment);
    expect(onClick).not.toHaveBeenCalled();
  });
});
