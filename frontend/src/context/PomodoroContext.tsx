import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from "react";

import completeSoundUrl from "@/assets/sounds/task-complete.mp3";
import { authStore, AUTH_CHANGE_EVENT } from "@/services/authService";
import { pomoService } from "@/services/pomoService";

/**
 * Represents the modes of the focus timer.
 */
export type PomodoroMode = "focus" | "shortBreak" | "longBreak";

interface PomodoroContextValue {
  timeLeft: number;
  initialDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  isActive: boolean;
  mode: PomodoroMode;
  viewingMode: PomodoroMode;
  showModal: boolean;
  modalMessage: string;
  setInitialDuration: (minutes: number) => void;
  setShortBreakDuration: (minutes: number) => void;
  setLongBreakDuration: (minutes: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  adjustTime: (deltaSeconds: number) => void;
  setMode: (mode: PomodoroMode) => void;
  setViewingMode: (mode: PomodoroMode) => void;
  closeModal: () => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

/**
 * Custom hook to consume the Pomodoro context.
 */
export const usePomodoro = (): PomodoroContextValue => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error("usePomodoro must be used within a PomodoroProvider");
  }
  return context;
};

interface PomodoroProviderProps {
  children: ReactNode;
}

const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_SHORT_BREAK_MINUTES = 5;
const DEFAULT_LONG_BREAK_MINUTES = 15;
const MAX_MINUTES = 600;

const readStoredDuration = (key: string, fallback: number) => {
  const saved = localStorage.getItem(key);
  if (!saved) {
    return fallback;
  }
  const parsed = parseInt(saved, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.max(parsed, 1), MAX_MINUTES);
};

/**
 * Provider for focus timer state and logic.
 * @param root0 - Provider props.
 * @param root0.children - Child nodes wrapped by the provider.
 */
export const PomodoroProvider = ({ children }: PomodoroProviderProps) => {
  const [initialDuration, setInitialDurationState] = useState<number>(() => (
    readStoredDuration("pomo_initial_duration", DEFAULT_FOCUS_MINUTES)
  ));
  const [shortBreakDuration, setShortBreakDurationState] = useState<number>(() => (
    readStoredDuration("pomo_short_break_duration", DEFAULT_SHORT_BREAK_MINUTES)
  ));
  const [longBreakDuration, setLongBreakDurationState] = useState<number>(() => (
    readStoredDuration("pomo_long_break_duration", DEFAULT_LONG_BREAK_MINUTES)
  ));
  const [mode, setModeState] = useState<PomodoroMode>("focus");
  const [viewingMode, setViewingMode] = useState<PomodoroMode>("focus");
  const [persistedFocusDuration, setPersistedFocusDuration] = useState<number>(initialDuration);
  const [timeLeft, setTimeLeft] = useState(initialDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [hasAuth, setHasAuth] = useState(() => Boolean(authStore.getToken()));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  const timerManager = useMemo(() => ({
    validateDuration: (minutes: number): number => Math.max(1, Math.min(minutes, MAX_MINUTES)),
    getFocusDuration: () => persistedFocusDuration,
    getDurationForMode: (targetMode: PomodoroMode) => {
      if (targetMode === "focus") {
        return persistedFocusDuration;
      }
      if (targetMode === "longBreak") {
        return longBreakDuration;
      }
      return shortBreakDuration;
    },
    syncInitialDuration: (minutes: number) => {
      setInitialDurationState(minutes);
      localStorage.setItem("pomo_initial_duration", minutes.toString());
    },
    syncShortBreakDuration: (minutes: number) => {
      setShortBreakDurationState(minutes);
      localStorage.setItem("pomo_short_break_duration", minutes.toString());
    },
    syncLongBreakDuration: (minutes: number) => {
      setLongBreakDurationState(minutes);
      localStorage.setItem("pomo_long_break_duration", minutes.toString());
    },
  }), [longBreakDuration, persistedFocusDuration, shortBreakDuration]);

  useEffect(() => {
    audioRef.current = new Audio(completeSoundUrl);
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      const authenticated = Boolean(authStore.getToken());
      setHasAuth(authenticated);
      if (!authenticated) {
        setIsActive(false);
      }
    };
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  }, []);

  const playNotification = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => console.error("Failed to play audio:", error));
    }
  }, []);

  const synchroniseCountdownWithDuration = useCallback((targetMode: PomodoroMode) => {
    const duration = timerManager.getDurationForMode(targetMode);
    setTimeLeft(duration * 60);
  }, [timerManager]);

  const stopTimer = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    synchroniseCountdownWithDuration(viewingMode);
  }, [stopTimer, synchroniseCountdownWithDuration, viewingMode]);

  const setInitialDuration = useCallback((minutes: number) => {
    const validMinutes = timerManager.validateDuration(minutes);
    timerManager.syncInitialDuration(validMinutes);
    setPersistedFocusDuration(validMinutes);
    if (mode === viewingMode && viewingMode === "focus" && !isActive) {
      setTimeLeft(validMinutes * 60);
    }
  }, [isActive, mode, timerManager, viewingMode]);

  const setShortBreakDuration = useCallback((minutes: number) => {
    const validMinutes = timerManager.validateDuration(minutes);
    timerManager.syncShortBreakDuration(validMinutes);
    if (mode === viewingMode && viewingMode === "shortBreak" && !isActive) {
      setTimeLeft(validMinutes * 60);
    }
  }, [isActive, mode, timerManager, viewingMode]);

  const setLongBreakDuration = useCallback((minutes: number) => {
    const validMinutes = timerManager.validateDuration(minutes);
    timerManager.syncLongBreakDuration(validMinutes);
    if (mode === viewingMode && viewingMode === "longBreak" && !isActive) {
      setTimeLeft(validMinutes * 60);
    }
  }, [isActive, mode, timerManager, viewingMode]);

  const setMode = useCallback((newMode: PomodoroMode) => {
    setViewingMode(newMode);

    if (!isActive) {
      setModeState(newMode);
      synchroniseCountdownWithDuration(newMode);
    }
  }, [isActive, synchroniseCountdownWithDuration]);

  const onTimerComplete = useCallback(async () => {
    stopTimer();
    playNotification();

    if (mode === "focus") {
      setModalMessage("Focus period complete. Time for a break.");
      setShowModal(true);

      try {
        await pomoService.recordSession(timerManager.getFocusDuration());
      } catch (error) {
        console.error("Failed to record session:", error);
      }
    } else {
      setModalMessage("Break finished. Back to focus.");
      setShowModal(true);
      setModeState("focus");
      setViewingMode("focus");
      synchroniseCountdownWithDuration("focus");
    }
  }, [mode, playNotification, stopTimer, synchroniseCountdownWithDuration, timerManager]);

  const handleExplicitModeHandover = useCallback(() => {
    if (viewingMode !== mode) {
      stopTimer();
      setModeState(viewingMode);
      synchroniseCountdownWithDuration(viewingMode);
    }
  }, [mode, stopTimer, synchroniseCountdownWithDuration, viewingMode]);

  const startTimer = useCallback(() => {
    if (!hasAuth) {
      return;
    }

    handleExplicitModeHandover();

    if (timeLeft <= 0) {
      const duration = timerManager.getDurationForMode(mode);
      setTimeLeft(duration * 60);
    }

    setIsActive(true);
  }, [handleExplicitModeHandover, hasAuth, mode, timeLeft, timerManager]);

  const adjustTime = useCallback((deltaSeconds: number) => {
    setTimeLeft((previous) => {
      const next = previous + deltaSeconds;
      if (next <= 0) {
        return 0;
      }
      return Math.min(next, MAX_MINUTES * 60);
    });
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void onTimerComplete();
    }
  }, [timeLeft, isActive, onTimerComplete]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((previous) => previous - 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const closeModal = () => setShowModal(false);

  const value: PomodoroContextValue = {
    timeLeft,
    initialDuration,
    shortBreakDuration,
    longBreakDuration,
    isActive,
    mode,
    viewingMode,
    showModal,
    modalMessage,
    setInitialDuration,
    setShortBreakDuration,
    setLongBreakDuration,
    startTimer,
    stopTimer,
    resetTimer,
    adjustTime,
    setMode,
    setViewingMode,
    closeModal,
  };

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
};
