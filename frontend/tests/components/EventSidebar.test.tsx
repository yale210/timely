import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import EventSidebar from "../../src/components/EventSidebar";
import type { Category, Event } from "../../src/types";

// Mock Headless UI to avoid Transition issues in JSDOM
vi.mock("@headlessui/react", async () => {
  const actual = await vi.importActual("@headlessui/react");
  return {
    ...actual,
    Transition: ({ children, show }: { children: React.ReactNode; show: boolean }) => (show ? children : null),
    TransitionChild: ({ children }: { children: React.ReactNode }) => children,
    Dialog: ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
        <div data-testid="dialog">
            {children}
            {/* Simulation of clicking outside or technical close */}
            <button data-testid="dialog-close-trigger" onClick={onClose}>Trigger onClose</button>
        </div>
    ),
    DialogPanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  };
});

// Mock EventForm
vi.mock("../../src/components/EventForm", () => ({
  default: ({ onSubmit, onCancel, initialData }: { onSubmit: (data: unknown) => void; onCancel: () => void; initialData?: Event }) => (
    <div data-testid="event-form">
      <span>{initialData ? "Edit Form" : "Add Form"}</span>
      <button onClick={() => onSubmit({ title: "New Event" })}>Submit Form</button>
      <button onClick={onCancel}>Cancel Form</button>
    </div>
  ),
}));

// Mock ConfirmationModal
vi.mock("../../src/components/ConfirmationModal", () => ({
  default: ({ isOpen, onClose, onConfirm, title }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string }) =>
    isOpen ? (
      <div data-testid="confirmation-modal">
        <h2>{title}</h2>
        <button onClick={onConfirm}>Confirm Delete</button>
        <button onClick={onClose}>Cancel Delete</button>
      </div>
    ) : null,
}));

describe("EventSidebar", () => {
  const mockCategories: Category[] = [
    { id: 1, text: "Work" },
  ];

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when isOpen is false", () => {
    render(
      <EventSidebar
        isOpen={false}
        onClose={mockOnClose}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.queryByText(/Add New Event/i)).not.toBeInTheDocument();
  });

  it("renders 'Add New Event' when no initialData is provided", () => {
    render(
      <EventSidebar
        isOpen={true}
        onClose={mockOnClose}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText(/Add New Event/i)).toBeInTheDocument();
  });

  it("renders 'Edit Event' and delete button when initialData is provided", () => {
    const initialData: Event = {
      id: 123,
      title: "Existing Event",
      start_time: "2023-01-01T10:00:00Z",
      end_time: "2023-01-01T11:00:00Z",
      categories: [],
      reminders: [],
    };

    render(
      <EventSidebar
        isOpen={true}
        onClose={mockOnClose}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        initialData={initialData}
      />
    );

    expect(screen.getByText(/Edit Event/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "delete" })).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    render(
      <EventSidebar
        isOpen={true}
        onClose={mockOnClose}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onSubmit and onClose when form is submitted", () => {
    render(
      <EventSidebar
        isOpen={true}
        onClose={mockOnClose}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText("Submit Form"));
    expect(mockOnSubmit).toHaveBeenCalledWith({ title: "New Event" });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when form cancel is clicked", () => {
    render(
      <EventSidebar
        isOpen={true}
        onClose={mockOnClose}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText("Cancel Form"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("opens delete confirmation modal and handles deletion", () => {
    const initialData: Event = {
      id: 123,
      title: "Existing Event",
      start_time: "2023-01-01T10:00:00Z",
      end_time: "2023-01-01T11:00:00Z",
      categories: [],
      reminders: [],
    };

    render(
      <EventSidebar
        isOpen={true}
        onClose={mockOnClose}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        initialData={initialData}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Confirm Delete"));
    expect(mockOnDelete).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("closes delete confirmation modal when cancelled", () => {
     const initialData: Event = {
      id: 123,
      title: "Existing Event",
      start_time: "2023-01-01T10:00:00Z",
      end_time: "2023-01-01T11:00:00Z",
      categories: [],
      reminders: [],
    };

    render(
      <EventSidebar
        isOpen={true}
        onClose={mockOnClose}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        initialData={initialData}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    fireEvent.click(screen.getByText("Cancel Delete"));
    expect(screen.queryByTestId("confirmation-modal")).not.toBeInTheDocument();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it("does not render delete button if onDelete is not provided", () => {
    const initialData: Event = {
      id: 123,
      title: "Existing Event",
      start_time: "2023-01-01T10:00:00Z",
      end_time: "2023-01-01T11:00:00Z",
      categories: [],
      reminders: [],
    };

    render(
      <EventSidebar
        isOpen={true}
        onClose={mockOnClose}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        initialData={initialData}
      />
    );

    expect(screen.queryByRole("button", { name: "delete" })).not.toBeInTheDocument();
  });
});
