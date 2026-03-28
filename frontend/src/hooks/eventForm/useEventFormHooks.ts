import { useEffect, type RefObject } from "react";
import { combineTimezoneDateAndTimeToIso } from "@/utils/userTimezone";
import { getServerTime } from "@/services/eventService";

interface EventFormDataChangeArgs {
  onDataChange?: (data: {
    title: string;
    description: string;
    start_time: string;
  }) => void;
  startDate: string;
  startTime: string;
  title: string;
  description: string;
}

interface EventFormServerTimeSyncArgs {
  getCurrentTimestamp: () => number;
  clockSkewWarningThresholdMs: number;
  setServerTimeOffsetMs: React.Dispatch<React.SetStateAction<number | null>>;
  setValidationNowMs: React.Dispatch<React.SetStateAction<number>>;
  setClockSkewWarning: React.Dispatch<React.SetStateAction<string | null>>;
}

interface ColourPickerMenuEffectArgs {
  showPickerMenu: boolean;
  pickerPosition: { top: number; left: number } | null;
  pickerRef: RefObject<HTMLDivElement | null>;
  setShowPickerMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setPickerPosition: React.Dispatch<
    React.SetStateAction<{ top: number; left: number } | null>
  >;
}

/**
 * Emits event form changes upward.
 * @param args Event form change arguments.
 */
export function useEventFormDataChange(args: EventFormDataChangeArgs) {
  const {
    onDataChange,
    startDate,
    startTime,
    title,
    description,
  } = args;

  useEffect(() => {
    if (!onDataChange) {
      return;
    }

    onDataChange({
      title,
      description,
      start_time: combineTimezoneDateAndTimeToIso(startDate, startTime),
    });
  }, [onDataChange, startDate, startTime, title, description]);
}

/**
 * Synchronises local validation time with server time.
 * @param args Server time sync arguments.
 */
export function useEventFormServerTimeSync(args: EventFormServerTimeSyncArgs) {
  const {
    getCurrentTimestamp,
    clockSkewWarningThresholdMs,
    setServerTimeOffsetMs,
    setValidationNowMs,
    setClockSkewWarning,
  } = args;

  useEffect(() => {
    let mounted = true;

    async function syncServerTime() {
      try {
        const { server_time } = await getServerTime();
        const now = getCurrentTimestamp();
        const offsetMs = new Date(server_time).getTime() - now;

        if (!mounted) {
          return;
        }

        setServerTimeOffsetMs(offsetMs);
        setValidationNowMs(now);
        setClockSkewWarning(
          Math.abs(offsetMs) >= clockSkewWarningThresholdMs
            ? "Your device clock appears out of sync with the server. Reminder validation uses server time."
            : null,
        );
      } catch (error) {
        console.error("Failed to sync server time for reminder validation", error);

        if (mounted) {
          setValidationNowMs(getCurrentTimestamp());
        }
      }
    }

    void syncServerTime();

    return () => {
      mounted = false;
    };
  }, [
    getCurrentTimestamp,
    clockSkewWarningThresholdMs,
    setServerTimeOffsetMs,
    setValidationNowMs,
    setClockSkewWarning,
  ]);
}

/**
 * Closes the colour picker menu when clicking outside it.
 * @param args Colour picker effect arguments.
 */
export function useColourPickerMenuEffect(args: ColourPickerMenuEffectArgs) {
  const {
    showPickerMenu,
    pickerPosition,
    pickerRef,
    setShowPickerMenu,
    setPickerPosition,
  } = args;

  useEffect(() => {
    if (!showPickerMenu || !pickerPosition) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (pickerRef.current?.contains(target)) {
        return;
      }

      setShowPickerMenu(false);
      setPickerPosition(null);
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [
    showPickerMenu,
    pickerPosition,
    pickerRef,
    setShowPickerMenu,
    setPickerPosition,
  ]);
}