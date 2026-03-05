import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import type React from "react";
import EventSidebar from "@/components/EventSidebar";
import type { Category, Event } from "@/types";

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
        <button data-testid="dialog-close-trigger" onClick={onClose}>
          Trigger onClose
        </button>
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
vi.mock("../../src/components/modals/ConfirmationModal", async () => {
  const shim = await import("../utils/ConfirmationModalShim");
  return { default: shim.default };
});

describe("EventSidebar", () => {
  const mockCategories: Category[] = [{ id: 1, text: "Work" }];

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when isOpen is false", () => {
    render(
      <EventSidebar isOpen={false} onClose={mockOnClose} categories={mockCategories} onSubmit={mockOnSubmit} onDelete={mockOnDelete} />
    );

    expect(screen.queryByText(/Add New Event/i)).not.toBeInTheDocument();
  });

  it("renders 'Add New Event' when no initialData is provided", () => {
    render(
      <EventSidebar isOpen={true} onClose={mockOnClose} categories={mockCategories} onSubmit={mockOnSubmit} onDelete={mockOnDelete} />
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
      <EventSidebar isOpen={true} onClose={mockOnClose} categories={mockCategories} onSubmit={mockOnSubmit} onDelete={mockOnDelete} initialData={initialData} />
    );

    expect(screen.getByText(/Edit Event/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "delete" })).toBeInTheDocument();
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
      <EventSidebar isOpen={true} onClose={mockOnClose} categories={mockCategories} onSubmit={mockOnSubmit} initialData={initialData} />
    );

    expect(screen.queryByRole("button", { name: "delete" })).not.toBeInTheDocument();
  });
});

