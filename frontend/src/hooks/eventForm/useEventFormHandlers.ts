import {
  ONE_HOUR_MS,
  safeToISOString,
  toLocalDateInputValue,
  withTime,
} from "@/hooks/eventForm/eventFormDates";
import {
  fromMinutesBefore,
  toMinutesBefore,
} from "@/hooks/eventForm/eventFormReminderHelpers";
import {
  isEventSubmissionEqual,
  normaliseEventSubmission,
} from "@/hooks/eventForm/normaliseEventSubmission";

const CLOCK_SKEW_WARNING_THRESHOLD_MS = 5 * 60 * 1_000;
export const INITIAL_VALIDATION_NOW_MS = Date.now();
const getCurrentTimestamp = (): number => Date.now();

/**
 * Returns methods and constants used in EventForm
 */
export const getEventFormHandlers = () => {
  return {
    safeToISOString,
    CLOCK_SKEW_WARNING_THRESHOLD_MS,
    INITIAL_VALIDATION_NOW_MS,
    getCurrentTimestamp,
    ONE_HOUR_MS,
    withTime,
    toLocalDateInputValue,
    toMinutesBefore,
    normaliseEventSubmission,
    isEventSubmissionEqual,
    fromMinutesBefore,
  }
}
