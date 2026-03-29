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

function getClockSkewWarning(offsetMs: number, thresholdMs: number) {
  return Math.abs(offsetMs) >= thresholdMs
    ? "Your device clock appears out of sync with the server. Reminder validation uses server time."
    : null;
}

function applyServerTimeSync(
  serverTime: string,
  args: EventFormServerTimeSyncArgs,
) {
  const now = args.getCurrentTimestamp();
  const offsetMs = new Date(serverTime).getTime() - now;

  args.setServerTimeOffsetMs(offsetMs);
  args.setValidationNowMs(now);
  args.setClockSkewWarning(getClockSkewWarning(offsetMs, args.clockSkewWarningThresholdMs));
}

function handleServerTimeSyncError(
  error: unknown,
  args: EventFormServerTimeSyncArgs,
) {
  console.error("Failed to sync server time for reminder validation", error);
  args.setValidationNowMs(args.getCurrentTimestamp());
}

async function syncServerTime(
  args: EventFormServerTimeSyncArgs,
  shouldApplyState: () => boolean,
) {
  try {
    const { server_time } = await getServerTime();
    if (!shouldApplyState()) {
      return;
    }

    applyServerTimeSync(server_time, args);
  } catch (error) {
    if (!shouldApplyState()) {
      return;
    }

    handleServerTimeSyncError(error, args);
  }
}

function shouldIgnorePickerPointerEvent(
  target: EventTarget | null,
  pickerRef: RefObject<HTMLDivElement | null>,
) {
  return !(target instanceof Node) || Boolean(pickerRef.current?.contains(target));
}

function buildPickerPointerDownHandler(
  pickerRef: RefObject<HTMLDivElement | null>,
  setShowPickerMenu: ColourPickerMenuEffectArgs["setShowPickerMenu"],
  setPickerPosition: ColourPickerMenuEffectArgs["setPickerPosition"],
) {
  return (event: MouseEvent) => {
    if (shouldIgnorePickerPointerEvent(event.target, pickerRef)) {
      return;
    }

    setShowPickerMenu(false);
    setPickerPosition(null);
  };
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
    void syncServerTime({
      getCurrentTimestamp,
      clockSkewWarningThresholdMs,
      setServerTimeOffsetMs,
      setValidationNowMs,
      setClockSkewWarning,
    }, () => mounted);

    return () => {
      mounted = false;
    };
  }, [
    clockSkewWarningThresholdMs,
    getCurrentTimestamp,
    setClockSkewWarning,
    setServerTimeOffsetMs,
    setValidationNowMs,
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

    const handlePointerDown = buildPickerPointerDownHandler(
      pickerRef,
      setShowPickerMenu,
      setPickerPosition,
    );
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [pickerPosition, pickerRef, setPickerPosition, setShowPickerMenu, showPickerMenu]);
}
