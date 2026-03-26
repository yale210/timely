import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Pomodoro from "@/pages/Pomodoro";
import { usePomodoro } from "@/context/PomodoroContext";
import { getTasks, updateTask } from "@/services/taskService";

vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@headlessui/react", () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogPanel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Transition: ({ show, children }: { show: boolean; children: ReactNode }) => (show ? <>{children}</> : null),
  TransitionChild: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/context/PomodoroContext", () => ({
  usePomodoro: vi.fn(),
}));

vi.mock("@/components/layout/PomodoroModal", () => ({
  PomodoroModal: () => <div>Pomodoro overlay</div>,
}));

vi.mock("@/components/pomodoro/PomodoroTimerPanel", () => ({
  default: ({ onOpenSettings }: { onOpenSettings: () => void }) => (
    <button type="button" onClick={onOpenSettings}>
      Open timer settings
    </button>
  ),
}));

vi.mock("@/services/taskService", () => ({
  getTasks: vi.fn(),
  updateTask: vi.fn(),
}));

describe("Pomodoro page", () => {
  const setInitialDuration = vi.fn();
  const setShortBreakDuration = vi.fn();
  const setLongBreakDuration = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePomodoro).mockReturnValue({
      mode: "focus",
      isActive: false,
      initialDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      setInitialDuration,
      setShortBreakDuration,
      setLongBreakDuration,
    } as any);
    vi.mocked(getTasks).mockResolvedValue([
      {
        id: 1,
        title: "Essay block",
        completed: false,
        estimated_minutes: 30,
        allocation: [
          {
            start: "2099-01-01T10:00:00Z",
            end: "2099-01-01T10:30:00Z",
          },
        ],
      },
    ] as any);
    vi.mocked(updateTask).mockResolvedValue({} as any);
  });

  it("renders scheduled tasks and toggles completion", async () => {
    render(<Pomodoro />);

    expect(screen.getByRole("heading", { name: "Pomodoro" })).toBeDefined();
    expect(await screen.findByText("Essay block")).toBeDefined();

    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith(1, { completed: true });
    });
  });

  it("opens timer settings and saves updated durations", async () => {
    render(<Pomodoro />);

    fireEvent.click(screen.getByRole("button", { name: "Open timer settings" }));

    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[0], { target: { value: "30" } });
    fireEvent.change(inputs[1], { target: { value: "7" } });
    fireEvent.change(inputs[2], { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(setInitialDuration).toHaveBeenCalledWith(30);
    expect(setShortBreakDuration).toHaveBeenCalledWith(7);
    expect(setLongBreakDuration).toHaveBeenCalledWith(20);
  });
});
