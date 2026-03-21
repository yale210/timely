/**
 * Utility functions for converting between total minutes and HH:MM format.
 */

/**
 * Converts total minutes into hours and remaining minutes.
 * @param totalMinutes - The total number of minutes.
 * @returns An object containing the hours and minutes.
 */
export const convertMinutesToHHMM = (totalMinutes: number): { hours: number; minutes: number } => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
};

/**
 * Converts hours and minutes into a total sum of minutes.
 * @param hours - The number of hours.
 * @param minutes - The number of minutes.
 * @returns The total number of minutes.
 */
export const convertHHMMToMinutes = (hours: number, minutes: number): number => {
  return (hours * 60) + minutes;
};

/**
 * Parses and validates HH:MM strings into a total minute count.
 * Enforces a minimum of 1 minute and a maximum of 600 minutes (10 hours).
 * @param hh - Hours string.
 * @param mm - Minutes string.
 * @returns Validated total minutes.
 */
export const parseAndValidateHHMM = (hh: string, mm: string): number => {
  let h = parseInt(hh, 10) || 0;
  let m = parseInt(mm, 10) || 0;

  // Overflow handling (e.g., 90 mins -> 1h 30m)
  if (m >= 60) {
    h += Math.floor(m / 60);
    m = m % 60;
  }

  const totalMins = (h * 60) + m;
  // Band 5 Constraint: 1 min floor, 10 hour ceiling
  return Math.max(1, Math.min(totalMins, 600));
};
