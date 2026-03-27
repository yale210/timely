export const USER_DEFAULT_LANDING_PAGE_STORAGE_KEY = "user_default_landing_page";
export const USER_WEEK_STARTS_ON_STORAGE_KEY = "user_week_starts_on";
export const USER_TIME_FORMAT_STORAGE_KEY = "user_time_format";
export const USER_PREFERENCES_CHANGE_EVENT = "user-preferences-change";

export type LandingPagePreference = "dashboard" | "calendar" | "tasks";
export type WeekStartsOnPreference = "monday" | "sunday";
export type TimeFormatPreference = "24h" | "12h";

const dispatchPreferencesChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(USER_PREFERENCES_CHANGE_EVENT));
  }
};

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

export const getStoredDefaultLandingPagePath = (): "/dashboard" | "/calendar" | "/tasks" => {
  const page = getStoredDefaultLandingPage();
  if (page === "calendar") return "/calendar";
  if (page === "tasks") return "/tasks";
  return "/dashboard";
};

export const setStoredDefaultLandingPage = (value: LandingPagePreference) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_DEFAULT_LANDING_PAGE_STORAGE_KEY, value);
  dispatchPreferencesChange();
};

export const getStoredWeekStartsOn = (): WeekStartsOnPreference => {
  if (typeof window === "undefined") {
    return "monday";
  }

  return localStorage.getItem(USER_WEEK_STARTS_ON_STORAGE_KEY) === "sunday" ? "sunday" : "monday";
};

export const setStoredWeekStartsOn = (value: WeekStartsOnPreference) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_WEEK_STARTS_ON_STORAGE_KEY, value);
  dispatchPreferencesChange();
};

export const getStoredTimeFormat = (): TimeFormatPreference => {
  if (typeof window === "undefined") {
    return "24h";
  }

  return localStorage.getItem(USER_TIME_FORMAT_STORAGE_KEY) === "12h" ? "12h" : "24h";
};

export const setStoredTimeFormat = (value: TimeFormatPreference) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_TIME_FORMAT_STORAGE_KEY, value);
  dispatchPreferencesChange();
};

export const resetStoredUserPreferences = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_DEFAULT_LANDING_PAGE_STORAGE_KEY);
  localStorage.removeItem(USER_WEEK_STARTS_ON_STORAGE_KEY);
  localStorage.removeItem(USER_TIME_FORMAT_STORAGE_KEY);
  dispatchPreferencesChange();
};
