import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from "react";
import { authStore, AUTH_CHANGE_EVENT } from "@/services/authService";
import { pomoService } from "@/services/pomoService";
import completeSoundUrl from "@/assets/sounds/task-complete.mp3";

/**
 * Represents the modes of the Pomodoro timer.
 */
export type PomodoroMode = "focus" | "break";

interface PomodoroContextValue {
  timeLeft: number;
  initialDuration: number | "";
  isActive: boolean;
  mode: PomodoroMode;
  viewingMode: PomodoroMode;
  showModal: boolean;
  modalMessage: string;
  setInitialDuration: (minutes: number | "") => void;
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
const DEFAULT_BREAK_MINUTES = 5;
const MAX_MINUTES = 600; // 10 hours

/**
 * Provider for Pomodoro state and logic.
 * @param props - The component props.
 * @param props.children - The child components to be wrapped by the provider.
 */
export const PomodoroProvider = ({ children }: PomodoroProviderProps) => {
  const [initialDuration, setInitialDurationState] = useState<number | "">(() => {
    const saved = localStorage.getItem("pomo_initial_duration");
    if (!saved) return DEFAULT_FOCUS_MINUTES;
    const parsed = parseInt(saved, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_FOCUS_MINUTES;
    return Math.min(Math.max(parsed, 1), MAX_MINUTES);
  });

  const [mode, setModeState] = useState<PomodoroMode>("focus");
  const [viewingMode, setViewingMode] = useState<PomodoroMode>("focus");
  const [persistedFocusDuration, setPersistedFocusDuration] = useState<number | "">(initialDuration);
  const [timeLeft, setTimeLeft] = useState((typeof initialDuration === "number" ? initialDuration : DEFAULT_FOCUS_MINUTES) * 60);
  const [isActive, setIsActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [hasAuth, setHasAuth] = useState(() => Boolean(authStore.getToken()));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  /**
   * Timer Manager handles duration validation and mode transitions.
   */
  const timerManager = useMemo(() => ({
    validateDuration: (mins: number | ""): number | "" => {
      if (mins === "") return "";
      return Math.max(1, Math.min(mins, MAX_MINUTES));
    },
    getFocusDuration: () => (typeof persistedFocusDuration === "number" ? persistedFocusDuration : DEFAULT_FOCUS_MINUTES),
    getBreakDuration: () => DEFAULT_BREAK_MINUTES,
    syncInitialDuration: (mins: number | "") => {
      setInitialDurationState(mins);
      if (mins !== "") {
        localStorage.setItem("pomo_initial_duration", mins.toString());
      }
    }
  }), [persistedFocusDuration]);

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
      audioRef.current.play().catch((err) => console.error("Failed to play audio:", err));
    }
  }, []);

  /**
   * Synchronises the countdown timer with the current duration settings.
   * @param targetMode - The mode to synchronise with (focus or break).
   */
  const synchroniseCountdownWithDuration = useCallback((targetMode: PomodoroMode) => {
    const duration = targetMode === "focus" ? timerManager.getFocusDuration() : timerManager.getBreakDuration();
    setInitialDurationState(targetMode === "focus" ? persistedFocusDuration : timerManager.getBreakDuration());
    setTimeLeft(duration * 60);
  }, [timerManager, persistedFocusDuration]);

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

  const setInitialDuration = useCallback((minutes: number | "") => {
    const validMinutes = timerManager.validateDuration(minutes);
    timerManager.syncInitialDuration(validMinutes);
    if (viewingMode === "focus" && validMinutes !== "") {
      setPersistedFocusDuration(validMinutes);
    }
    // Only update timeLeft if the timer is not active AND we are looking at the mode that is currently "active" in the background
    if (mode === viewingMode && !isActive && validMinutes !== "") {
      setTimeLeft(validMinutes * 60);
    }
  }, [mode, viewingMode, isActive, timerManager]);

  const setMode = useCallback((newMode: PomodoroMode) => {
    setViewingMode(newMode);
    
    if (!isActive) {
      setModeState(newMode);
      synchroniseCountdownWithDuration(newMode);
    } else if (newMode !== mode) {
      // Looking at a different mode than the one ticking, update input display only
      setInitialDurationState(newMode === "focus" ? persistedFocusDuration : timerManager.getBreakDuration());
    }
  }, [isActive, mode, persistedFocusDuration, timerManager, synchroniseCountdownWithDuration]);

  const onTimerComplete = useCallback(async () => {
    stopTimer();
    playNotification();

    if (mode === "focus") {
      setModalMessage("Time is up, go grab a drink!");
      setShowModal(true);
      
      // Record session in backend
      try {
        await pomoService.recordSession(timerManager.getFocusDuration());
      } catch (error) {
        console.error("Failed to record session:", error);
      }

      // After focus, user might manually switch to break or it just stops.
      // The plan says: "once the 'Short Break' hits zero, the system automatically switches the mode back to 'Pomofocus' and triggers the start function"
      // It doesn't explicitly say focus switches to break automatically, but usually it stops.
    } else {
      setModalMessage("Break has finished! Lock in");
      setShowModal(true);
      // Auto-switch to focus and start
      setModeState("focus");
      setViewingMode("focus");
      synchroniseCountdownWithDuration("focus");
      setIsActive(true);
    }
  }, [mode, playNotification, stopTimer, timerManager, synchroniseCountdownWithDuration]);

  const handleExplicitModeHandover = useCallback(() => {
    if (viewingMode !== mode) {
      stopTimer();
      setModeState(viewingMode);
      synchroniseCountdownWithDuration(viewingMode);
    }
  }, [viewingMode, mode, stopTimer, synchroniseCountdownWithDuration]);

  const startTimer = useCallback(() => {
    if (!hasAuth) return;
    handleExplicitModeHandover();

    // Ensure timer re-initialises from duration setting if it hit zero
    if (timeLeft <= 0) {
      const duration = mode === "focus" ? timerManager.getFocusDuration() : timerManager.getBreakDuration();
      setTimeLeft(duration * 60);
    }

    setIsActive(true);
  }, [hasAuth, handleExplicitModeHandover, timeLeft, mode, timerManager]);

  const adjustTime = useCallback((deltaSeconds: number) => {
    setTimeLeft((prev) => {
      const next = prev + deltaSeconds;
      if (next <= 0) return 0;
      return Math.min(next, MAX_MINUTES * 60);
    });
  }, []);

  useEffect(() => {
    // Synchronise with initialDuration if in focus mode and not active
    if (viewingMode === "focus" && !isActive) {
      const nextMins = Math.max(1, Math.round(timeLeft / 60));
      timerManager.syncInitialDuration(nextMins);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPersistedFocusDuration(nextMins);
    }
  }, [timeLeft, viewingMode, isActive, timerManager]);

  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void onTimerComplete();
    }
  }, [timeLeft, isActive, onTimerComplete]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
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
    isActive,
    mode,
    viewingMode,
    showModal,
    modalMessage,
    setInitialDuration,
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
