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
