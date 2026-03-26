import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PomodoroModal } from "@/components/layout/PomodoroModal";
import { usePomodoro } from "@/context/PomodoroContext";

vi.mock("@/context/PomodoroContext", () => ({
  usePomodoro: vi.fn(),
}));

const mockedUsePomodoro = vi.mocked(usePomodoro);

describe("PomodoroModal", () => {
  const closeModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not show the modal content when showModal is false", () => {
    mockedUsePomodoro.mockReturnValue({
      timeLeft: 1500,
      initialDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      isActive: false,
      mode: "focus",
      viewingMode: "focus",
      showModal: false,
      modalMessage: "Done!",
      setInitialDuration: vi.fn(),
      setShortBreakDuration: vi.fn(),
      setLongBreakDuration: vi.fn(),
      startTimer: vi.fn(),
      stopTimer: vi.fn(),
      resetTimer: vi.fn(),
      adjustTime: vi.fn(),
      setMode: vi.fn(),
      setViewingMode: vi.fn(),
      closeModal,
    });

    render(<PomodoroModal />);

    expect(screen.queryByText("Pomodoro")).not.toBeInTheDocument();
    expect(screen.queryByText("Done!")).not.toBeInTheDocument();
  });

  it("renders the modal title and message when showModal is true", () => {
    mockedUsePomodoro.mockReturnValue({
      timeLeft: 1500,
      initialDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      isActive: false,
      mode: "focus",
      viewingMode: "focus",
      showModal: true,
      modalMessage: "Focus period complete. Time for a break.",
      setInitialDuration: vi.fn(),
      setShortBreakDuration: vi.fn(),
      setLongBreakDuration: vi.fn(),
      startTimer: vi.fn(),
      stopTimer: vi.fn(),
      resetTimer: vi.fn(),
      adjustTime: vi.fn(),
      setMode: vi.fn(),
      setViewingMode: vi.fn(),
      closeModal,
    });

    render(<PomodoroModal />);

    expect(screen.getByText("Pomodoro")).toBeInTheDocument();
    expect(
      screen.getByText("Focus period complete. Time for a break."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Got it!" })).toBeInTheDocument();
  });

  it("calls closeModal when Got it is clicked", async () => {
    mockedUsePomodoro.mockReturnValue({
      timeLeft: 1500,
      initialDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      isActive: false,
      mode: "focus",
      viewingMode: "focus",
      showModal: true,
      modalMessage: "Break finished. Back to focus.",
      setInitialDuration: vi.fn(),
      setShortBreakDuration: vi.fn(),
      setLongBreakDuration: vi.fn(),
      startTimer: vi.fn(),
      stopTimer: vi.fn(),
      resetTimer: vi.fn(),
      adjustTime: vi.fn(),
      setMode: vi.fn(),
      setViewingMode: vi.fn(),
      closeModal,
    });

    render(<PomodoroModal />);

    await userEvent.click(screen.getByRole("button", { name: "Got it!" }));

    expect(closeModal).toHaveBeenCalledTimes(1);
  });
});