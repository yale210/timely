import moment from "moment";

interface WeekOption {
  label: string;
  value: string;
}

/**
 * Generates a list of past weeks for a dropdown selector.
 * @param count - The number of past weeks to generate.
 */
export const getPastWeeks = (count = 12): WeekOption[] => {
  const weeks: WeekOption[] = [];
  let current = moment().startOf("isoWeek");
  for (let i = 0; i < count; i++) {
    weeks.push({ label: `Week of ${current.format("D MMM YYYY")}`, value: current.format("YYYY-MM-DD") });
    current = current.clone().subtract(1, "week");
  }
  return weeks;
};

export type { WeekOption };
