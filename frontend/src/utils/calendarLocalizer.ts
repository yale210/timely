import { useEffect, useMemo } from "react";
import moment from "moment-timezone";
import { momentLocalizer } from "react-big-calendar";
import { useUserTimezone } from "@/utils/userTimezone";

/**
 * Returns a react-big-calendar localizer that tracks the selected app timezone.
 * @returns A moment-based calendar localizer configured for the active timezone.
 */
export const useCalendarLocalizer = () => {
  const userTimezone = useUserTimezone();
  const safeTimezone = useMemo(
    () => (moment.tz.zone(userTimezone) ? userTimezone : "UTC"),
    [userTimezone],
  );

  useEffect(() => {
    moment.tz.setDefault(safeTimezone);

    return () => {
      moment.tz.setDefault();
    };
  }, [safeTimezone]);

  return useMemo(() => momentLocalizer(moment), [safeTimezone]);
};
