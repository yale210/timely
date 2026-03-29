import { useEffect, useMemo } from "react";
import moment from "moment-timezone";
import { momentLocalizer } from "react-big-calendar";
import { useUserTimezone } from "@/utils/userTimezone";
import { CALENDAR_DISPLAY_TIMEZONE } from "@/utils/calendarDisplayTime";

/**
 * Returns a react-big-calendar localizer that tracks the selected app timezone.
 * @returns A moment-based calendar localizer configured for the active timezone.
 */
export const useCalendarLocalizer = (forcedTimezone?: string) => {
  const userTimezone = useUserTimezone();
  const safeTimezone = useMemo(
    () => {
      const requestedTimezone = forcedTimezone ?? userTimezone;
      return moment.tz.zone(requestedTimezone) ? requestedTimezone : CALENDAR_DISPLAY_TIMEZONE;
    },
    [forcedTimezone, userTimezone],
  );

  useEffect(() => {
    moment.tz.setDefault(safeTimezone);

    return () => {
      moment.tz.setDefault();
    };
  }, [safeTimezone]);

  return useMemo(() => momentLocalizer(moment), []);
};
