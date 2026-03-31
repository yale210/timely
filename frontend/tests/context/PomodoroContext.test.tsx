import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.unmock("@/context/PomodoroContext");

vi.mock("@/services/pomoService", () => ({
  pomoService: {
    recordSession: vi.fn(),
  },
}));

vi.mock("@/services/authService", async () => {
  const actual = await vi.importActual("@/services/authService");

  return {
    ...actual,
    authStore: {
      getToken: vi.fn(),
      getUser: vi.fn(),
      setToken: vi.fn(),
      setUser: vi.fn(),
      clear: vi.fn(),
    },
    AUTH_CHANGE_EVENT: "auth-change",
  };
});

import { PomodoroProvider, usePomodoro } from "@/context/PomodoroContext";
import { AUTH_CHANGE_EVENT, authStore } from "@/services/authService";
import { pomoService } from "@/services/pomoService";

const mockedGetToken = vi.spyOn(authStore, "getToken");
const mockedPomoService = pomoService as {
  recordSession: ReturnType<typeof vi.fn>;
};

vi.stubGlobal("Audio", vi.fn(() => ({
  play: vi.fn().mockResolvedValue(undefined),
})));

const renderWithProvider = (ui: React.ReactNode) =>
  render(<PomodoroProvider>{ui}</PomodoroProvider>);

const getText = (testId: string) => screen.getByTestId(testId).textContent;

const click = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));

const advance = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const StateConsumer = () => {
  const ctx = usePomodoro();

  return (
    <div>
      <div data-testid="timeLeft">{ctx.timeLeft}</div>
      <div data-testid="initialDuration">{ctx.initialDuration}</div>
      <div data-testid="shortBreakDuration">{ctx.shortBreakDuration}</div>
      <div data-testid="longBreakDuration">{ctx.longBreakDuration}</div>
      <div data-testid="isActive">{String(ctx.isActive)}</div>
      <div data-testid="mode">{ctx.mode}</div>
      <div data-testid="viewingMode">{ctx.viewingMode}</div>
      <div data-testid="showModal">{String(ctx.showModal)}</div>
      <div data-testid="modalMessage">{ctx.modalMessage}</div>

      <button type="button" onClick={() => ctx.setInitialDuration(30)}>
        setInitial30
      </button>
      <button type="button" onClick={() => ctx.setShortBreakDuration(7)}>
        setShort7
      </button>
      <button type="button" onClick={() => ctx.setLongBreakDuration(20)}>
        setLong20
      </button>
      <button type="button" onClick={() => ctx.startTimer()}>
        start
      </button>
      <button type="button" onClick={() => ctx.stopTimer()}>
        stop
      </button>
      <button type="button" onClick={() => ctx.resetTimer()}>
        reset
      </button>
      <button type="button" onClick={() => ctx.adjustTime(-300)}>
        minus300
      </button>
      <button type="button" onClick={() => ctx.adjustTime(300)}>
        plus300
      </button>
      <button type="button" onClick={() => ctx.setMode("shortBreak")}>
        modeShort
      </button>
      <button type="button" onClick={() => ctx.setMode("longBreak")}>
        modeLong
      </button>
      <button type="button" onClick={() => ctx.setViewingMode("longBreak")}>
        viewLong
      </button>
      <button type="button" onClick={() => ctx.closeModal()}>
        closeModal
      </button>
    </div>
  );
};

const ClampConsumer = () => {
  const ctx = usePomodoro();

  return (
    <div>
      <div data-testid="initialDuration">{ctx.initialDuration}</div>
      <button type="button" onClick={() => ctx.setInitialDuration(0)}>
        setZero
      </button>
      <button type="button" onClick={() => ctx.setInitialDuration(999)}>
        setHuge
      </button>
    </div>
  );
};

const AdjustConsumer = () => {
  const ctx = usePomodoro();

  return (
    <div>
      <div data-testid="timeLeft">{ctx.timeLeft}</div>
      <button type="button" onClick={() => ctx.adjustTime(-999999)}>
        drop
      </button>
      <button type="button" onClick={() => ctx.adjustTime(999999)}>
        raise
      </button>
    </div>
  );
};

const CompletionConsumer = ({ breakMode = false }: { breakMode?: boolean }) => {
  const ctx = usePomodoro();

  return (
    <div>
      <div data-testid="mode">{ctx.mode}</div>
      <div data-testid="viewingMode">{ctx.viewingMode}</div>
      <div data-testid="timeLeft">{ctx.timeLeft}</div>
      <div data-testid="showModal">{String(ctx.showModal)}</div>
      <div data-testid="modalMessage">{ctx.modalMessage}</div>
      <div data-testid="isActive">{String(ctx.isActive)}</div>

      {breakMode ? (
        <button type="button" onClick={() => ctx.setMode("shortBreak")}>
          shortMode
        </button>
      ) : null}

      <button type="button" onClick={() => ctx.adjustTime(-(ctx.timeLeft - 1))}>
        setToOneSecond
      </button>
      <button type="button" onClick={() => ctx.startTimer()}>
        start
      </button>
      <button type="button" onClick={() => ctx.closeModal()}>
        closeModal
      </button>
    </div>
  );
};

describe("PomodoroContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
    mockedGetToken.mockReturnValue("token");
    mockedPomoService.recordSession.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws when usePomodoro is used outside the provider", () => {
    const ProblemChild = () => {
      usePomodoro();
      return null;
    };

    expect(() => render(<ProblemChild />)).toThrow(
      "usePomodoro must be used within a PomodoroProvider",
    );
  });

  it("provides default state values", () => {
    renderWithProvider(<StateConsumer />);

    expect(getText("initialDuration")).toBe("25");
    expect(getText("shortBreakDuration")).toBe("5");
    expect(getText("longBreakDuration")).toBe("15");
    expect(getText("timeLeft")).toBe("1500");
    expect(getText("isActive")).toBe("false");
    expect(getText("mode")).toBe("focus");
    expect(getText("viewingMode")).toBe("focus");
    expect(getText("showModal")).toBe("false");
  });

  it("reads stored durations from localStorage", () => {
    localStorage.setItem("pomo_initial_duration", "40");
    localStorage.setItem("pomo_short_break_duration", "8");
    localStorage.setItem("pomo_long_break_duration", "18");

    renderWithProvider(<StateConsumer />);

    expect(getText("initialDuration")).toBe("40");
    expect(getText("shortBreakDuration")).toBe("8");
    expect(getText("longBreakDuration")).toBe("18");
    expect(getText("timeLeft")).toBe("2400");
  });

  it("falls back to defaults for invalid stored durations", () => {
    localStorage.setItem("pomo_initial_duration", "0");
    localStorage.setItem("pomo_short_break_duration", "-1");
    localStorage.setItem("pomo_long_break_duration", "not-a-number");

    renderWithProvider(<StateConsumer />);

    expect(getText("initialDuration")).toBe("25");
    expect(getText("shortBreakDuration")).toBe("5");
    expect(getText("longBreakDuration")).toBe("15");
  });

  it("updates and persists initial duration", () => {
    renderWithProvider(<StateConsumer />);

    click("setInitial30");

    expect(getText("initialDuration")).toBe("30");
    expect(getText("timeLeft")).toBe("1800");
    expect(localStorage.getItem("pomo_initial_duration")).toBe("30");
  });

  it("clamps duration setters between 1 and 600", () => {
    renderWithProvider(<ClampConsumer />);

    click("setZero");
    expect(getText("initialDuration")).toBe("1");

    click("setHuge");
    expect(getText("initialDuration")).toBe("600");
  });

  it("updates short and long break durations", () => {
    renderWithProvider(<StateConsumer />);

    click("modeShort");
    click("setShort7");
    expect(getText("shortBreakDuration")).toBe("7");
    expect(getText("timeLeft")).toBe("420");
    expect(localStorage.getItem("pomo_short_break_duration")).toBe("7");

    click("modeLong");
    click("setLong20");
    expect(getText("longBreakDuration")).toBe("20");
    expect(getText("timeLeft")).toBe("1200");
    expect(localStorage.getItem("pomo_long_break_duration")).toBe("20");
  });

  it("setMode changes viewingMode and active mode when timer is not active", () => {
    renderWithProvider(<StateConsumer />);

    click("modeShort");

    expect(getText("mode")).toBe("shortBreak");
    expect(getText("viewingMode")).toBe("shortBreak");
    expect(getText("timeLeft")).toBe("300");
  });

  it("startTimer does nothing when not authenticated", () => {
    mockedGetToken.mockReturnValue(null);

    renderWithProvider(<StateConsumer />);

    click("start");

    expect(getText("isActive")).toBe("false");
  });

  it("starts and stops the timer when authenticated", () => {
    renderWithProvider(<StateConsumer />);

    click("start");
    expect(getText("isActive")).toBe("true");

    advance(2000);
    expect(getText("timeLeft")).toBe("1498");

    click("stop");
    expect(getText("isActive")).toBe("false");
  });

  it("resets the timer to the current viewing mode duration", () => {
    renderWithProvider(<StateConsumer />);

    click("modeShort");
    click("minus300");
    expect(getText("timeLeft")).toBe("0");

    click("reset");
    expect(getText("timeLeft")).toBe("300");
  });

  it("adjustTime clamps at zero and max minutes", () => {
    renderWithProvider(<AdjustConsumer />);

    click("drop");
    expect(getText("timeLeft")).toBe("0");

    click("raise");
    expect(getText("timeLeft")).toBe(String(600 * 60));
  });

  it("handles explicit mode handover when starting from a different viewing mode", () => {
    renderWithProvider(<StateConsumer />);

    click("viewLong");
    click("start");

    expect(getText("mode")).toBe("longBreak");
    expect(getText("viewingMode")).toBe("longBreak");
    expect(getText("timeLeft")).toBe("900");
    expect(getText("isActive")).toBe("true");
  });

  it("stops the timer when auth is removed via auth-change event", () => {
    renderWithProvider(<StateConsumer />);

    click("start");
    expect(getText("isActive")).toBe("true");

    mockedGetToken.mockReturnValue(null);

    act(() => {
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    });

    expect(getText("isActive")).toBe("false");
  });

  it("shows a focus-complete modal, records the session, and stops the timer", () => {
    renderWithProvider(<CompletionConsumer />);

    click("setToOneSecond");
    click("start");
    advance(1000);

    expect(getText("showModal")).toBe("true");
    expect(getText("modalMessage")).toBe("Focus period complete. Time for a break.");
    expect(getText("isActive")).toBe("false");
    expect(mockedPomoService.recordSession).toHaveBeenCalledWith(25);
  });

  it("handles break completion by returning to focus mode", () => {
    renderWithProvider(<CompletionConsumer breakMode />);

    click("shortMode");
    click("setToOneSecond");
    click("start");
    advance(1000);

    expect(getText("showModal")).toBe("true");
    expect(getText("modalMessage")).toBe("Break finished. Back to focus.");
    expect(getText("mode")).toBe("focus");
    expect(getText("viewingMode")).toBe("focus");
    expect(getText("timeLeft")).toBe("1500");
  });

  it("closeModal hides the modal", () => {
    renderWithProvider(<CompletionConsumer />);

    click("setToOneSecond");
    click("start");
    advance(1000);

    expect(getText("showModal")).toBe("true");

    click("closeModal");

    expect(getText("showModal")).toBe("false");
  });
});
