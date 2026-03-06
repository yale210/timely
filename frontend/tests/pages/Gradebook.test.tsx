import type { ReactNode } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Gradebook from "@/pages/Gradebook";
import useGrades from "@/hooks/gradebook/useGrades";
import useCategories from "@/hooks/tasks/useCategories";

// Mock hooks
vi.mock("@/hooks/gradebook/useGrades", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/tasks/useCategories", () => ({
  default: vi.fn(),
}));

// Mock AppLayout
vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

// Mock child components
vi.mock("@/components/modals/CreateGradeModal.tsx", () => ({
  default: ({ open, onClose, onCreated, onUpdated }: { open: boolean, onClose: () => void, onCreated: () => void, onUpdated: () => void }) => open ? (
    <div data-testid="create-modal">
      <button onClick={onClose}>Close</button>
      <button onClick={onCreated}>Created</button>
      <button onClick={onUpdated}>Updated</button>
    </div>
  ) : null,
}));

vi.mock("@/components/modals/ConfirmationModal", () => ({
  default: ({ isOpen, onConfirm, onClose }: { isOpen: boolean, onConfirm: () => void, onClose: () => void }) => isOpen ? (
    <div data-testid="confirm-modal">
      <button onClick={onConfirm}>Confirm Delete</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}));

describe("Gradebook Page", () => {
  const mockRefreshGrades = vi.fn();
  const mockSetModalOpen = vi.fn();
  const mockSetSelectedCategoryId = vi.fn();
  const mockSetPendingDeleteId = vi.fn();
  const mockHandleEditGrade = vi.fn();
  const mockCloseModal = vi.fn();
  const mockConfirmDelete = vi.fn();

  const mockUseGradesResult = {
    grades: [],
    loading: false,
    modalOpen: false,
    editInitial: null,
    selectedCategoryId: null,
    pendingDeleteId: null,
    filteredGrades: [],
    setModalOpen: mockSetModalOpen,
    setSelectedCategoryId: mockSetSelectedCategoryId,
    setPendingDeleteId: mockSetPendingDeleteId,
    refreshGrades: mockRefreshGrades,
    handleEditGrade: mockHandleEditGrade,
    closeModal: mockCloseModal,
    confirmDelete: mockConfirmDelete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGrades).mockReturnValue(mockUseGradesResult);
    vi.mocked(useCategories).mockReturnValue({ categories: [], loading: false });
  });

  it("renders main layout and components", () => {
    render(<Gradebook />);
    expect(screen.getByTestId("app-layout")).toBeDefined();
    expect(screen.getByText("Gradebook")).toBeDefined(); // Header text
  });

  it("handles modal open and close logic", () => {
    vi.mocked(useGrades).mockReturnValue({
        ...mockUseGradesResult,
        modalOpen: true,
    });
    render(<Gradebook />);
    
    expect(screen.getByTestId("create-modal")).toBeDefined();
    
    fireEvent.click(screen.getByText("Close"));
    expect(mockCloseModal).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Created"));
    expect(mockCloseModal).toHaveBeenCalled();
    expect(mockRefreshGrades).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Updated"));
    expect(mockCloseModal).toHaveBeenCalled();
    expect(mockRefreshGrades).toHaveBeenCalled();
  });

  it("handles delete confirmation", () => {
    vi.mocked(useGrades).mockReturnValue({
        ...mockUseGradesResult,
        pendingDeleteId: 123,
    });
    render(<Gradebook />);
    
    expect(screen.getByTestId("confirm-modal")).toBeDefined();
    
    fireEvent.click(screen.getByText("Confirm Delete"));
    expect(mockConfirmDelete).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Close"));
    expect(mockSetPendingDeleteId).toHaveBeenCalledWith(null);
  });
});
