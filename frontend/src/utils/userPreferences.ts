import { useSyncExternalStore } from "react";

/** Local storage key for the user's default landing page. */
export const USER_DEFAULT_LANDING_PAGE_STORAGE_KEY = "user_default_landing_page";
/** Local storage key for the user's preferred week start. */
export const USER_WEEK_STARTS_ON_STORAGE_KEY = "user_week_starts_on";
/** Local storage key for the user's preferred time format. */
export const USER_TIME_FORMAT_STORAGE_KEY = "user_time_format";
/** Browser event dispatched after local preference values change. */
export const USER_PREFERENCES_CHANGE_EVENT = "user-preferences-change";

/** Supported app landing pages. */
export type LandingPagePreference = "dashboard" | "calendar" | "tasks";
/** Supported week-start preferences. */
export type WeekStartsOnPreference = "monday" | "sunday";
/** Supported time display formats. */
export type TimeFormatPreference = "24h" | "12h";

/** Broadcasts that stored user preferences changed. */
const dispatchPreferencesChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(USER_PREFERENCES_CHANGE_EVENT));
  }
};

/**
 * Reads the stored default landing page.
 * @returns The preferred landing page, defaulting to dashboard.
 */
export const getStoredDefaultLandingPage = (): LandingPagePreference => {
  if (typeof window === "undefined") {
    return "dashboard";
  }

  const value = localStorage.getItem(USER_DEFAULT_LANDING_PAGE_STORAGE_KEY);
  if (value === "calendar" || value === "tasks") {
    return value;
  }
  return "dashboard";
};

/**
 * Maps the stored landing-page preference to a route path.
 * @returns The route path for the preferred landing page.
 */
export const getStoredDefaultLandingPagePath = (): "/dashboard" | "/calendar" | "/tasks" => {
  const page = getStoredDefaultLandingPage();
  if (page === "calendar") return "/calendar";
  if (page === "tasks") return "/tasks";
  return "/dashboard";
};

/**
 * Stores the preferred landing page.
 * @param value - Landing page preference to persist.
 */
export const setStoredDefaultLandingPage = (value: LandingPagePreference) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_DEFAULT_LANDING_PAGE_STORAGE_KEY, value);
  dispatchPreferencesChange();
};

/**
 * Reads the stored week-start preference.
 * @returns The preferred first day of the week.
 */
export const getStoredWeekStartsOn = (): WeekStartsOnPreference => {
  if (typeof window === "undefined") {
    return "monday";
  }

  return localStorage.getItem(USER_WEEK_STARTS_ON_STORAGE_KEY) === "sunday" ? "sunday" : "monday";
};

/**
 * Subscribes React components to the stored week-start preference.
 * @returns The preferred first day of the week.
 */
export const useStoredWeekStartsOn = (): WeekStartsOnPreference => useSyncExternalStore(
  (onStoreChange) => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const handler = () => onStoreChange();
    window.addEventListener(USER_PREFERENCES_CHANGE_EVENT, handler);
    return () => window.removeEventListener(USER_PREFERENCES_CHANGE_EVENT, handler);
  },
  getStoredWeekStartsOn,
  () => "monday",
);

/**
 * Stores the preferred week-start value.
 * @param value - Week-start preference to persist.
 */
export const setStoredWeekStartsOn = (value: WeekStartsOnPreference) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_WEEK_STARTS_ON_STORAGE_KEY, value);
  dispatchPreferencesChange();
};

/**
 * Reads the stored time-format preference.
 * @returns The preferred time display format.
 */
export const getStoredTimeFormat = (): TimeFormatPreference => {
  if (typeof window === "undefined") {
    return "24h";
  }

  return localStorage.getItem(USER_TIME_FORMAT_STORAGE_KEY) === "12h" ? "12h" : "24h";
};

/**
 * Stores the preferred time format.
 * @param value - Time-format preference to persist.
 */
export const setStoredTimeFormat = (value: TimeFormatPreference) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_TIME_FORMAT_STORAGE_KEY, value);
  dispatchPreferencesChange();
};

/**
 * Clears all stored user preference values.
 */
export const resetStoredUserPreferences = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_DEFAULT_LANDING_PAGE_STORAGE_KEY);
  localStorage.removeItem(USER_WEEK_STARTS_ON_STORAGE_KEY);
  localStorage.removeItem(USER_TIME_FORMAT_STORAGE_KEY);
  dispatchPreferencesChange();
};
