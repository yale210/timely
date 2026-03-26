import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Assessments from "@/pages/Assessments";
import { useAssessments } from "@/hooks/assessments/useAssessments";

vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@headlessui/react", () => ({
  Menu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MenuButton: ({ children, ...props }: { children: ReactNode }) => <button type="button" {...props}>{children}</button>,
  MenuItems: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MenuItem: ({ children }: { children: ((args: { focus: boolean }) => ReactNode) | ReactNode }) => (
    typeof children === "function" ? <>{children({ focus: false })}</> : <>{children}</>
  ),
}));

vi.mock("@/hooks/assessments/useAssessments", () => ({
  useAssessments: vi.fn(),
}));

vi.mock("@/components/assessments/AssessmentSection", () => ({
  default: ({
    title,
    assessments,
    onClick,
    onAddToGradebook,
    isGradebookEnabled,
  }: {
    title: string;
    assessments: { id: number; title: string }[];
    onClick: (assessment: { id: number; title: string }) => void;
    onAddToGradebook: (assessment: { id: number; title: string }) => void;
    isGradebookEnabled: boolean;
  }) => (
    <section>
      <h2>{title}</h2>
      {assessments.map((assessment) => (
        <div key={assessment.id}>
          <span>{assessment.title}</span>
          <button type="button" onClick={() => onClick(assessment)}>
            Open {title}
          </button>
          {isGradebookEnabled ? (
            <button type="button" onClick={() => onAddToGradebook(assessment)}>
              Gradebook {title}
            </button>
          ) : null}
        </div>
      ))}
    </section>
  ),
}));

vi.mock("@/components/assessments/AssessmentModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>Assessment modal</div> : null),
}));

vi.mock("@/components/modals/ConfirmationModal", () => ({
  default: ({ isOpen, title }: { isOpen: boolean; title: string }) => (isOpen ? <div>{title}</div> : null),
}));

vi.mock("@/components/modals/CreateGradeModal", () => ({
  default: ({ open }: { open: boolean }) => (open ? <div>Create grade modal</div> : null),
}));

describe("Assessments page", () => {
  const mockActions = {
    setSearch: vi.fn(),
    setSelectedCategoryId: vi.fn(),
    openNewAssessment: vi.fn(),
    openAssessment: vi.fn(),
    closeSidebar: vi.fn(),
    submitAssessment: vi.fn(),
    deleteAssessment: vi.fn(),
    setPendingDeleteId: vi.fn(),
    openGradebook: vi.fn(),
    closeGradebook: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    refresh: vi.fn(),
  };

  const upcomingAssessment = {
    id: 1,
    title: "Essay",
    due_date: "2099-01-01T10:00:00Z",
    updated_at: "2099-01-01T00:00:00Z",
    weighting_of_assessment: 40,
    completed: false,
    categories: [],
  } as any;

  const completedAssessment = {
    ...upcomingAssessment,
    id: 2,
    title: "Quiz",
    completed: true,
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAssessments).mockReturnValue({
      state: {
        assessments: [upcomingAssessment, completedAssessment],
        categories: [{ id: 1, text: "Coursework" }],
        sections: {
          overdue: [],
          upcoming: [upcomingAssessment],
          completed: [completedAssessment],
        },
        isGradebookEnabled: true,
        search: "",
        selectedCategoryId: null,
        isSidebarOpen: false,
        selectedAssessment: undefined,
        pendingDeleteId: null,
        gradebookSource: null,
      },
      loading: false,
      error: null,
      actions: mockActions,
    } as any);
  });

  it("renders sections and forwards page actions", () => {
    render(<Assessments />);

    expect(screen.getByRole("heading", { name: "Assessments" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Upcoming" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Completed" })).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText("Search assessments"), {
      target: { value: "essay" },
    });
    expect(mockActions.setSearch).toHaveBeenCalledWith("essay");

    fireEvent.click(screen.getByRole("button", { name: "Coursework" }));
    expect(mockActions.setSelectedCategoryId).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: /new/i }));
    expect(mockActions.openNewAssessment).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Open Upcoming" }));
    expect(mockActions.openAssessment).toHaveBeenCalledWith(upcomingAssessment);

    fireEvent.click(screen.getByRole("button", { name: "Gradebook Upcoming" }));
    expect(mockActions.openGradebook).toHaveBeenCalledWith(upcomingAssessment);
  });

  it("renders open modal states from hook state", () => {
    vi.mocked(useAssessments).mockReturnValue({
      state: {
        assessments: [upcomingAssessment],
        categories: [],
        sections: { overdue: [], upcoming: [upcomingAssessment], completed: [] },
        isGradebookEnabled: true,
        search: "",
        selectedCategoryId: null,
        isSidebarOpen: true,
        selectedAssessment: upcomingAssessment,
        pendingDeleteId: upcomingAssessment.id,
        gradebookSource: upcomingAssessment,
      },
      loading: false,
      error: null,
      actions: mockActions,
    } as any);

    render(<Assessments />);

    expect(screen.getByText("Assessment modal")).toBeDefined();
    expect(screen.getByText("Delete assessment?")).toBeDefined();
    expect(screen.getByText("Create grade modal")).toBeDefined();
  });
});
