import {
  ArrowPathIcon,
  Cog6ToothIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useRef } from "react";

import buttonClickSoundUrl from "@/assets/sounds/button-click.wav";
import { usePomodoro } from "@/context/PomodoroContext";
import { formatTime } from "@/utils/timeUtils";

interface PomodoroTimerPanelProps {
  onOpenSettings: () => void;
}

/**
 * Standalone Pomodoro timer panel for the Pomodoro page.
 * @param root0 - Component props.
 * @param root0.onOpenSettings - Opens the timer settings modal.
 */
const PomodoroTimerPanel = ({ onOpenSettings }: PomodoroTimerPanelProps) => {
  const {
    timeLeft,
    initialDuration,
    shortBreakDuration,
    longBreakDuration,
    isActive,
    mode,
    viewingMode,
    startTimer,
    stopTimer,
    resetTimer,
    adjustTime,
    setMode,
  } = usePomodoro();
  const buttonClickSoundRef = useRef<HTMLAudioElement | null>(
    typeof Audio === "undefined" ? null : new Audio(buttonClickSoundUrl),
  );

  const playButtonClickSound = () => {
    if (!buttonClickSoundRef.current) {
      return;
    }
    if (typeof window !== "undefined" && localStorage.getItem("disable_sound_effects") === "true") {
      return;
    }
    buttonClickSoundRef.current.currentTime = 0;
    void buttonClickSoundRef.current.play().catch(() => undefined);
  };

  const progressMaxSeconds = mode === "focus"
    ? initialDuration * 60
    : mode === "longBreak"
      ? longBreakDuration * 60
      : shortBreakDuration * 60;
  const displaySeconds = viewingMode === mode
    ? timeLeft
    : viewingMode === "focus"
      ? initialDuration * 60
      : viewingMode === "longBreak"
        ? longBreakDuration * 60
        : shortBreakDuration * 60;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setMode("focus")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              viewingMode === "focus"
                ? "bg-orange-100 text-orange-700 ring-1 ring-orange-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Focus period
          </button>
          <button
            type="button"
            onClick={() => setMode("shortBreak")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              viewingMode === "shortBreak"
                ? "bg-teal-100 text-teal-700 ring-1 ring-teal-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Short break
          </button>
          <button
            type="button"
            onClick={() => setMode("longBreak")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              viewingMode === "longBreak"
                ? "bg-blue-200 text-blue-900 ring-1 ring-blue-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Long break
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            aria-label="Timer settings"
            title="Timer settings"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
        </div>

        <div
          className="rounded-[2rem] p-8 ring-1 ring-gray-200 sm:p-12"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--text-color) 3%, var(--background)) 0%, var(--background) 52%, color-mix(in srgb, var(--primary) 10%, var(--background)) 100%)",
          }}
        >
          <div className="flex flex-col items-center gap-6">
            <div className="w-full max-w-2xl">
              <div className="text-center font-mono text-7xl font-bold leading-none text-gray-900 [text-decoration:none] sm:text-8xl lg:text-9xl">
                {formatTime(displaySeconds)}
              </div>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-white ring-1 ring-gray-200">
                <div
                  className={`h-full transition-all duration-1000 ${
                    viewingMode === "focus"
                      ? "bg-orange-500"
                      : viewingMode === "longBreak"
                        ? "bg-blue-500"
                        : "bg-teal-500"
                  }`}
                  style={{
                    width: viewingMode === mode
                      ? `${(timeLeft / progressMaxSeconds) * 100}%`
                      : "100%",
                  }}
                />
              </div>
              <p className="mt-4 text-center text-sm font-medium uppercase tracking-[0.22em] text-gray-500">
                {viewingMode === "focus"
                  ? `${initialDuration} min`
                  : viewingMode === "shortBreak"
                    ? `${shortBreakDuration} min`
                    : `${longBreakDuration} min`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => adjustTime(-300)}
                className="rounded-full p-3 text-gray-500 transition-colors hover:bg-white hover:text-gray-700"
                title="-5 mins"
              >
                <MinusIcon className="h-7 w-7" />
              </button>

              <button
                type="button"
                onClick={() => {
                  playButtonClickSound();
                  if (isActive && viewingMode === mode) {
                    stopTimer();
                    return;
                  }
                  startTimer();
                }}
                className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-105 active:scale-95 sm:h-24 sm:w-24 ${
                  isActive && viewingMode === mode ? "bg-red-500" : "bg-cyan-600"
                }`}
                title={isActive && viewingMode !== mode ? `Switch to ${viewingMode}` : isActive ? "Stop" : "Start"}
              >
                {isActive && viewingMode === mode ? (
                  <PauseIcon className="h-10 w-10 sm:h-12 sm:w-12" />
                ) : (
                  <PlayIcon className="h-10 w-10 sm:h-12 sm:w-12" />
                )}
              </button>

              <button
                type="button"
                onClick={() => adjustTime(300)}
                className="rounded-full p-3 text-gray-500 transition-colors hover:bg-white hover:text-gray-700"
                title="+5 mins"
              >
                <PlusIcon className="h-7 w-7" />
              </button>
            </div>

            <button
              type="button"
              onClick={resetTimer}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Restart
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PomodoroTimerPanel;
