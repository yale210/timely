import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PomodoroTimerPanel from "@/components/pomodoro/PomodoroTimerPanel";
import { usePomodoro } from "@/context/PomodoroContext";

vi.mock("@/context/PomodoroContext", () => ({
  usePomodoro: vi.fn(),
}));

const mockedUsePomodoro = vi.mocked(usePomodoro);

describe("PomodoroTimerPanel", () => {
  const baseContext = {
    timeLeft: 1500,
    initialDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    isActive: false,
    mode: "focus" as const,
    viewingMode: "focus" as const,
    showModal: false,
    modalMessage: "",
    setInitialDuration: vi.fn(),
    setShortBreakDuration: vi.fn(),
    setLongBreakDuration: vi.fn(),
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
    resetTimer: vi.fn(),
    adjustTime: vi.fn(),
    setMode: vi.fn(),
    setViewingMode: vi.fn(),
    closeModal: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the current formatted time and current duration label", () => {
    mockedUsePomodoro.mockReturnValue(baseContext);

    render(<PomodoroTimerPanel onOpenSettings={vi.fn()} />);

    expect(screen.getByText("25:00")).toBeInTheDocument();
    expect(screen.getByText("25 min")).toBeInTheDocument();
  });

  it("renders the viewed mode duration when viewingMode differs from mode", () => {
    mockedUsePomodoro.mockReturnValue({
      ...baseContext,
      mode: "focus",
      viewingMode: "longBreak",
      longBreakDuration: 20,
      timeLeft: 123,
    });

    render(<PomodoroTimerPanel onOpenSettings={vi.fn()} />);

    expect(screen.getByText("20:00")).toBeInTheDocument();
    expect(screen.getByText("20 min")).toBeInTheDocument();
  });

  it("calls setMode for focus, short break and long break buttons", () => {
    const setMode = vi.fn();
    mockedUsePomodoro.mockReturnValue({
      ...baseContext,
      setMode,
    });

    render(<PomodoroTimerPanel onOpenSettings={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Focus period" }));
    fireEvent.click(screen.getByRole("button", { name: "Short break" }));
    fireEvent.click(screen.getByRole("button", { name: "Long break" }));

    expect(setMode).toHaveBeenNthCalledWith(1, "focus");
    expect(setMode).toHaveBeenNthCalledWith(2, "shortBreak");
    expect(setMode).toHaveBeenNthCalledWith(3, "longBreak");
  });

  it("calls onOpenSettings from the settings button", () => {
    mockedUsePomodoro.mockReturnValue(baseContext);
    const onOpenSettings = vi.fn();

    render(<PomodoroTimerPanel onOpenSettings={onOpenSettings} />);

    fireEvent.click(screen.getByRole("button", { name: "Timer settings" }));

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("calls adjustTime with -300 and +300", () => {
    const adjustTime = vi.fn();
    mockedUsePomodoro.mockReturnValue({
      ...baseContext,
      adjustTime,
    });

    render(<PomodoroTimerPanel onOpenSettings={vi.fn()} />);

    fireEvent.click(screen.getByTitle("-5 mins"));
    fireEvent.click(screen.getByTitle("+5 mins"));

    expect(adjustTime).toHaveBeenNthCalledWith(1, -300);
    expect(adjustTime).toHaveBeenNthCalledWith(2, 300);
  });

  it("calls startTimer when inactive", () => {
    const startTimer = vi.fn();
    mockedUsePomodoro.mockReturnValue({
      ...baseContext,
      startTimer,
      isActive: false,
      viewingMode: "focus",
      mode: "focus",
    });

    render(<PomodoroTimerPanel onOpenSettings={vi.fn()} />);

    const buttons = screen.getAllByRole("button");
    const startStopButton = buttons.find((button) => button.getAttribute("title") === "Start");

    expect(startStopButton).toBeTruthy();

    fireEvent.click(startStopButton!);

    expect(startTimer).toHaveBeenCalledTimes(1);
  });

  it("calls stopTimer when active and viewing the active mode", () => {
    const stopTimer = vi.fn();
    mockedUsePomodoro.mockReturnValue({
      ...baseContext,
      stopTimer,
      isActive: true,
      viewingMode: "focus",
      mode: "focus",
    });

    render(<PomodoroTimerPanel onOpenSettings={vi.fn()} />);

    const stopButton = screen.getAllByRole("button").find(
      (button) => button.getAttribute("title") === "Stop",
    );

    expect(stopButton).toBeTruthy();

    fireEvent.click(stopButton!);

    expect(stopTimer).toHaveBeenCalledTimes(1);
  });

  it("calls startTimer instead of stopTimer when active but viewing a different mode", () => {
    const startTimer = vi.fn();
    const stopTimer = vi.fn();

    mockedUsePomodoro.mockReturnValue({
      ...baseContext,
      startTimer,
      stopTimer,
      isActive: true,
      mode: "focus",
      viewingMode: "shortBreak",
    });

    render(<PomodoroTimerPanel onOpenSettings={vi.fn()} />);

    const switchButton = screen.getAllByRole("button").find(
      (button) => button.getAttribute("title") === "Switch to shortBreak",
    );

    expect(switchButton).toBeTruthy();

    fireEvent.click(switchButton!);

    expect(startTimer).toHaveBeenCalledTimes(1);
    expect(stopTimer).not.toHaveBeenCalled();
  });

  it("calls resetTimer from the restart button", () => {
    const resetTimer = vi.fn();
    mockedUsePomodoro.mockReturnValue({
      ...baseContext,
      resetTimer,
    });

    render(<PomodoroTimerPanel onOpenSettings={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Restart/i }));

    expect(resetTimer).toHaveBeenCalledTimes(1);
  });

  it("does not try to play sound when sound effects are disabled", () => {
    localStorage.setItem("disable_sound_effects", "true");
    const startTimer = vi.fn();

    mockedUsePomodoro.mockReturnValue({
      ...baseContext,
      startTimer,
    });

    render(<PomodoroTimerPanel onOpenSettings={vi.fn()} />);

    const startButton = screen.getAllByRole("button").find(
      (button) => button.getAttribute("title") === "Start",
    );

    fireEvent.click(startButton!);

    expect(startTimer).toHaveBeenCalledTimes(1);
  });

  it("shows the short break duration label when viewing short break", () => {
    mockedUsePomodoro.mockReturnValue({
      ...baseContext,
      viewingMode: "shortBreak",
      shortBreakDuration: 7,
      timeLeft: 420,
    });

    render(<PomodoroTimerPanel onOpenSettings={vi.fn()} />);

    expect(screen.getByText("07:00")).toBeInTheDocument();
    expect(screen.getByText("7 min")).toBeInTheDocument();
  });
});