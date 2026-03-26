import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.unmock("@/context/PomodoroContext");

vi.mock("@/services/pomoService", () => ({
  pomoService: {
    recordSession: vi.fn(),
  },
}));

vi.mock("@/services/authService", async () => {
  const actual = await vi.importActual<typeof import("@/services/authService")>(
    "@/services/authService",
  );

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

const Consumer = () => {
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

describe("PomodoroContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
    mockedGetToken.mockReturnValue("token");
    mockedPomoService.recordSession.mockResolvedValue(undefined);
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
    render(
      <PomodoroProvider>
        <Consumer />
      </PomodoroProvider>,
    );

    expect(screen.getByTestId("initialDuration")).toHaveTextContent("25");
    expect(screen.getByTestId("shortBreakDuration")).toHaveTextContent("5");
    expect(screen.getByTestId("longBreakDuration")).toHaveTextContent("15");
    expect(screen.getByTestId("timeLeft")).toHaveTextContent("1500");
    expect(screen.getByTestId("isActive")).toHaveTextContent("false");
    expect(screen.getByTestId("mode")).toHaveTextContent("focus");
    expect(screen.getByTestId("viewingMode")).toHaveTextContent("focus");
    expect(screen.getByTestId("showModal")).toHaveTextContent("false");
  });

  it("reads stored durations from localStorage", () => {
    localStorage.setItem("pomo_initial_duration", "40");
    localStorage.setItem("pomo_short_break_duration", "8");
    localStorage.setItem("pomo_long_break_duration", "18");

    render(
      <PomodoroProvider>
        <Consumer />
      </PomodoroProvider>,
    );

    expect(screen.getByTestId("initialDuration")).toHaveTextContent("40");
    expect(screen.getByTestId("shortBreakDuration")).toHaveTextContent("8");
    expect(screen.getByTestId("longBreakDuration")).toHaveTextContent("18");
    expect(screen.getByTestId("timeLeft")).toHaveTextContent("2400");
  });

  it("falls back to defaults for invalid stored durations", () => {
    localStorage.setItem("pomo_initial_duration", "0");
    localStorage.setItem("pomo_short_break_duration", "-1");
    localStorage.setItem("pomo_long_break_duration", "not-a-number");

    render(
      <PomodoroProvider>
        <Consumer />
      </PomodoroProvider>,
    );

    expect(screen.getByTestId("initialDuration")).toHaveTextContent("25");
    expect(screen.getByTestId("shortBreakDuration")).toHaveTextContent("5");
    expect(screen.getByTestId("longBreakDuration")).toHaveTextContent("15");
  });

  it("updates and persists initial duration", async () => {
    render(
      <PomodoroProvider>
        <Consumer />
      </PomodoroProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "setInitial30" }));

    expect(screen.getByTestId("initialDuration")).toHaveTextContent("30");
    expect(screen.getByTestId("timeLeft")).toHaveTextContent("1800");
    expect(localStorage.getItem("pomo_initial_duration")).toBe("30");
  });

  it("clamps duration setters between 1 and 600", async () => {
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

    render(
      <PomodoroProvider>
        <ClampConsumer />
      </PomodoroProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "setZero" }));
    expect(screen.getByTestId("initialDuration")).toHaveTextContent("1");

    await userEvent.click(screen.getByRole("button", { name: "setHuge" }));
    expect(screen.getByTestId("initialDuration")).toHaveTextContent("600");
  });

  it("updates short and long break durations", async () => {
    render(
      <PomodoroProvider>
        <Consumer />
      </PomodoroProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "modeShort" }));
    await userEvent.click(screen.getByRole("button", { name: "setShort7" }));

    expect(screen.getByTestId("shortBreakDuration")).toHaveTextContent("7");
    expect(screen.getByTestId("timeLeft")).toHaveTextContent("420");
    expect(localStorage.getItem("pomo_short_break_duration")).toBe("7");

    await userEvent.click(screen.getByRole("button", { name: "modeLong" }));
    await userEvent.click(screen.getByRole("button", { name: "setLong20" }));

    expect(screen.getByTestId("longBreakDuration")).toHaveTextContent("20");
    expect(screen.getByTestId("timeLeft")).toHaveTextContent("1200");
    expect(localStorage.getItem("pomo_long_break_duration")).toBe("20");
  });

  it("setMode changes viewingMode and active mode when timer is not active", async () => {
    render(
      <PomodoroProvider>
        <Consumer />
      </PomodoroProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "modeShort" }));

    expect(screen.getByTestId("mode")).toHaveTextContent("shortBreak");
    expect(screen.getByTestId("viewingMode")).toHaveTextContent("shortBreak");
    expect(screen.getByTestId("timeLeft")).toHaveTextContent("300");
  });

  it("startTimer does nothing when not authenticated", async () => {
    mockedGetToken.mockReturnValue(null);

    render(
      <PomodoroProvider>
        <Consumer />
      </PomodoroProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "start" }));

    expect(screen.getByTestId("isActive")).toHaveTextContent("false");
  });

  it("starts and stops the timer when authenticated", async () => {
    render(
      <PomodoroProvider>
        <Consumer />
      </PomodoroProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "start" }));
    expect(screen.getByTestId("isActive")).toHaveTextContent("true");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId("timeLeft")).toHaveTextContent("1498");

    await userEvent.click(screen.getByRole("button", { name: "stop" }));
    expect(screen.getByTestId("isActive")).toHaveTextContent("false");
  });

  it("resets the timer to the current viewing mode duration", async () => {
    render(
      <PomodoroProvider>
        <Consumer />
      </PomodoroProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "modeShort" }));
    await userEvent.click(screen.getByRole("button", { name: "minus300" }));

    expect(screen.getByTestId("timeLeft")).toHaveTextContent("0");

    await userEvent.click(screen.getByRole("button", { name: "reset" }));
    expect(screen.getByTestId("timeLeft")).toHaveTextContent("300");
  });

  it("adjustTime clamps at zero and max minutes", async () => {
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

    render(
      <PomodoroProvider>
        <AdjustConsumer />
      </PomodoroProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "drop" }));
    expect(screen.getByTestId("timeLeft")).toHaveTextContent("0");

    await userEvent.click(screen.getByRole("button", { name: "raise" }));
    expect(screen.getByTestId("timeLeft")).toHaveTextContent(String(600 * 60));
  });

  it("handles explicit mode handover when starting from a different viewing mode", async () => {
    render(
      <PomodoroProvider>
        <Consumer />
      </PomodoroProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "viewLong" }));
    await userEvent.click(screen.getByRole("button", { name: "start" }));

    expect(screen.getByTestId("mode")).toHaveTextContent("longBreak");
    expect(screen.getByTestId("viewingMode")).toHaveTextContent("longBreak");
    expect(screen.getByTestId("timeLeft")).toHaveTextContent("900");
    expect(screen.getByTestId("isActive")).toHaveTextContent("true");
  });

  it("stops the timer when auth is removed via auth-change event", async () => {
    render(
      <PomodoroProvider>
        <Consumer />
      </PomodoroProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "start" }));
    expect(screen.getByTestId("isActive")).toHaveTextContent("true");

    mockedGetToken.mockReturnValue(null);

    act(() => {
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    });

    expect(screen.getByTestId("isActive")).toHaveTextContent("false");
  });

  it("shows a focus-complete modal, records the session, and stops the timer", async () => {
    const FocusCompleteConsumer = () => {
      const ctx = usePomodoro();
      return (
        <div>
          <div data-testid="showModal">{String(ctx.showModal)}</div>
          <div data-testid="modalMessage">{ctx.modalMessage}</div>
          <div data-testid="isActive">{String(ctx.isActive)}</div>
          <button type="button" onClick={() => ctx.adjustTime(-(ctx.timeLeft - 1))}>
            setToOneSecond
          </button>
          <button type="button" onClick={() => ctx.startTimer()}>
            start
          </button>
        </div>
      );
    };

    render(
      <PomodoroProvider>
        <FocusCompleteConsumer />
      </PomodoroProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "setToOneSecond" }));
    await userEvent.click(screen.getByRole("button", { name: "start" }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("showModal")).toHaveTextContent("true");
    expect(screen.getByTestId("modalMessage")).toHaveTextContent(
      "Focus period complete. Time for a break.",
    );
    expect(screen.getByTestId("isActive")).toHaveTextContent("false");
    expect(mockedPomoService.recordSession).toHaveBeenCalledWith(25);
  });

  it("handles break completion by returning to focus mode", async () => {
    const BreakCompleteConsumer = () => {
      const ctx = usePomodoro();
      return (
        <div>
          <div data-testid="mode">{ctx.mode}</div>
          <div data-testid="viewingMode">{ctx.viewingMode}</div>
          <div data-testid="timeLeft">{ctx.timeLeft}</div>
          <div data-testid="showModal">{String(ctx.showModal)}</div>
          <div data-testid="modalMessage">{ctx.modalMessage}</div>
          <button type="button" onClick={() => ctx.setMode("shortBreak")}>
            shortMode
          </button>
          <button type="button" onClick={() => ctx.adjustTime(-(ctx.timeLeft - 1))}>
            setToOneSecond
          </button>
          <button type="button" onClick={() => ctx.startTimer()}>
            start
          </button>
        </div>
      );
    };

    render(
      <PomodoroProvider>
        <BreakCompleteConsumer />
      </PomodoroProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "shortMode" }));
    await userEvent.click(screen.getByRole("button", { name: "setToOneSecond" }));
    await userEvent.click(screen.getByRole("button", { name: "start" }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("showModal")).toHaveTextContent("true");
    expect(screen.getByTestId("modalMessage")).toHaveTextContent("Break finished. Back to focus.");
    expect(screen.getByTestId("mode")).toHaveTextContent("focus");
    expect(screen.getByTestId("viewingMode")).toHaveTextContent("focus");
    expect(screen.getByTestId("timeLeft")).toHaveTextContent("1500");
  });

  it("closeModal hides the modal", async () => {
    const ModalConsumer = () => {
      const ctx = usePomodoro();
      return (
        <div>
          <div data-testid="showModal">{String(ctx.showModal)}</div>
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

    render(
      <PomodoroProvider>
        <ModalConsumer />
      </PomodoroProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "setToOneSecond" }));
    await userEvent.click(screen.getByRole("button", { name: "start" }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("showModal")).toHaveTextContent("true");

    await userEvent.click(screen.getByRole("button", { name: "closeModal" }));

    expect(screen.getByTestId("showModal")).toHaveTextContent("false");
  });
});