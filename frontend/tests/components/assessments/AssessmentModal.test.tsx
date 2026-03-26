import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AssessmentModal from "@/components/assessments/AssessmentModal";
import type { Assessment, Category } from "@/types";

vi.mock("@headlessui/react", () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogPanel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  Transition: ({ show, children }: { show: boolean; children: ReactNode }) => (show ? <>{children}</> : null),
  TransitionChild: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const categories: Category[] = [
  { id: 1, text: "COMP101", colour: "#2563eb" },
  { id: 2, text: "Exam", colour: "#f97316" },
];

const buildAssessment = (overrides: Partial<Assessment> = {}): Assessment => ({
  id: 4,
  title: "Existing Assessment",
  assessment_type: "EXAM",
  due_date: "2026-01-10T09:00:00Z",
  length_of_assessment: null,
  weighting_of_assessment: 40,
  notes: "Review lecture notes",
  reminder_offset: null,
  assessment_category: categories[1],
  module_category: categories[0],
  categories,
  completed: false,
  linked_event: null,
  linked_event_details: null,
  created_at: "2025-12-01T09:00:00Z",
  updated_at: "2025-12-05T09:00:00Z",
  ...overrides,
});

describe("AssessmentModal", () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();
  const onDelete = vi.fn();
  const onCreateCategory = vi.fn();
  const onUpdateCategory = vi.fn();
  const onDeleteCategory = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <AssessmentModal
        isOpen={false}
        onClose={onClose}
        categories={categories}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={onSubmit}
        onDelete={onDelete}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("validates that a title is required", async () => {
    render(
      <AssessmentModal
        isOpen
        onClose={onClose}
        categories={categories}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={onSubmit}
        onDelete={onDelete}
      />,
    );

    fireEvent.submit(screen.getByRole("button", { name: "Save assessment" }).closest("form")!);

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates event start and end ordering", async () => {
    render(
      <AssessmentModal
        isOpen
        onClose={onClose}
        categories={categories}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={onSubmit}
        onDelete={onDelete}
      />,
    );

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Timed test" } });
    fireEvent.click(screen.getByRole("button", { name: /Event assessment/i }));
    fireEvent.change(screen.getByLabelText("Start"), { target: { value: "2026-01-10T15:00" } });
    fireEvent.change(screen.getByLabelText("End"), { target: { value: "2026-01-10T14:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Save assessment" }));

    expect(
      await screen.findByText("Calendar event end time must be after start time."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a deadline assessment and closes on success", async () => {
    onSubmit.mockResolvedValue(undefined);

    render(
      <AssessmentModal
        isOpen
        onClose={onClose}
        categories={categories}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={onSubmit}
        onDelete={onDelete}
      />,
    );

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Database Coursework" } });
    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-01-10T12:30" } });
    fireEvent.change(screen.getByLabelText("Weighting %"), { target: { value: "35" } });
    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "Use APA references" } });
    fireEvent.change(screen.getByLabelText("Assessment type"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Subject / module"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save assessment" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: "Database Coursework",
        assessment_type: "OTHER",
        due_date: new Date("2026-01-10T12:30").toISOString(),
        length_of_assessment: null,
        weighting_of_assessment: 35,
        notes: "Use APA references",
        reminder_offset: null,
        assessment_category: 2,
        module_category: 1,
        categories: [2, 1],
        completed: false,
        event_details: null,
      });
    });

    expect(onClose).toHaveBeenCalled();
  });

  it("surfaces nested API submission errors", async () => {
    onSubmit.mockRejectedValue({
      response: {
        data: {
          non_field_errors: ["Schedule conflict"],
        },
      },
    });

    render(
      <AssessmentModal
        isOpen
        onClose={onClose}
        categories={categories}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={onSubmit}
        onDelete={onDelete}
      />,
    );

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Resit" } });
    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-01-12T11:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Save assessment" }));

    expect(await screen.findByText("non_field_errors: Schedule conflict")).toBeInTheDocument();
  });

  it("shows the delete action for existing assessments", () => {
    render(
      <AssessmentModal
        isOpen
        onClose={onClose}
        assessment={buildAssessment()}
        categories={categories}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={onSubmit}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByTitle("Delete assessment"));

    expect(onDelete).toHaveBeenCalled();
    expect(screen.getByDisplayValue("Existing Assessment")).toBeInTheDocument();
  });
});
