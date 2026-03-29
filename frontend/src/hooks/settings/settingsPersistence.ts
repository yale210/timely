import type { Dispatch, SetStateAction } from "react";
import * as categoryService from "@/services/categoryService";
import { preferenceService } from "@/services/preferenceService";
import type { Category, Preference } from "@/types";
import { formatDjangoFormError } from "@/utils/apiErrors";
import { validatePreference } from "@/utils/preferenceValidation";
import { getSchedulingDayMaxMinutes } from "@/utils/schedulingLimits";
import { setStoredUserTimezone } from "@/utils/userTimezone";
import {
  setStoredDefaultLandingPage,
  setStoredTimeFormat,
  setStoredWeekStartsOn,
} from "@/utils/userPreferences";

type SetPreference = Dispatch<SetStateAction<Preference | null>>;
type SetCategories = Dispatch<SetStateAction<Category[]>>;
type SetFieldErrors = Dispatch<SetStateAction<Record<string, string[]>>>;
type SetStringState = Dispatch<SetStateAction<string | null>>;
type SetBooleanState = Dispatch<SetStateAction<boolean>>;

/**
 * Returns whether the current settings section should trigger preference loading.
 * @param section - Active settings section.
 * @returns True when preference data is required for the section.
 */
export function shouldLoadPreferenceForSection(section: string) {
  return section === "preferences" || section === "general" || section === "categories";
}

function applySavedPreferenceSideEffects(preference: Preference) {
  setStoredUserTimezone(preference.timezone);
  setStoredDefaultLandingPage(preference.default_landing_page ?? "dashboard");
  setStoredWeekStartsOn(preference.week_starts_on ?? "monday");
  setStoredTimeFormat(preference.time_format ?? "24h");
  localStorage.setItem(
    "disable_sound_effects",
    String(preference.disable_sound_effects ?? false),
  );
}

function buildPreferenceUpdatePayload(preference: Preference) {
  return {
    day_start: preference.day_start.slice(0, 5),
    day_end: preference.day_end.slice(0, 5),
    day_schedule: preference.day_schedule,
    timezone: preference.timezone,
    max_hours_study_per_day: preference.max_hours_study_per_day,
    max_days_ahead: preference.max_days_ahead,
    drag_snap_minutes: preference.drag_snap_minutes,
    limit_max_hours: preference.limit_max_hours,
    disable_sound_effects: preference.disable_sound_effects,
    default_landing_page: preference.default_landing_page ?? "dashboard",
    week_starts_on: preference.week_starts_on ?? "monday",
    time_format: preference.time_format ?? "24h",
    days_off: preference.days_off,
  };
}

/**
 * Clamps a category study limit to the current daily maximum while preserving null values.
 * @param value - Proposed category limit in minutes.
 * @param maxDailyMinutes - Maximum allowed minutes for the current schedule.
 * @returns A normalized category limit value.
 */
export function updateCategoryLimitValue(
  value: number | null | undefined,
  maxDailyMinutes: number,
) {
  if (value == null) {
    return null;
  }

  return Math.max(0, Math.min(value, maxDailyMinutes));
}

function applyLoadedPreference(
  nextPreference: Preference,
  setPreference: SetPreference,
  setSavedPreference: SetPreference,
) {
  setPreference(nextPreference);
  setSavedPreference(nextPreference);
  applySavedPreferenceSideEffects(nextPreference);
}

function applyPreferenceRequestError(
  error: unknown,
  setPreferenceError: SetStringState,
  setFieldErrors: SetFieldErrors,
) {
  const parsed = formatDjangoFormError(error);
  setPreferenceError(parsed.message);
  setFieldErrors(parsed.fieldErrors);
}

function beginPreferenceRequest(
  setLoading: SetBooleanState,
  setPreferenceError: SetStringState,
  setFieldErrors: SetFieldErrors,
) {
  setLoading(true);
  setPreferenceError(null);
  setFieldErrors({});
}

function hasPreferenceClientErrors(
  preference: Preference,
  setFieldErrors: SetFieldErrors,
  setPreferenceError: SetStringState,
) {
  const clientErrors = validatePreference(preference);
  if (Object.keys(clientErrors).length === 0) {
    return false;
  }

  setFieldErrors(clientErrors);
  setPreferenceError("Please fix the highlighted fields.");
  return true;
}

function buildCategoryLimitPatch(category: Category, maxDailyMinutes: number) {
  return {
    max_daily_study_time: updateCategoryLimitValue(
      category.max_daily_study_time,
      maxDailyMinutes,
    ),
  };
}

/**
 * Loads the current user preference into settings state.
 * @param setPreference - Setter for the editable preference state.
 * @param setSavedPreference - Setter for the saved preference snapshot.
 * @param setFieldErrors - Setter for preference field-level errors.
 * @param setIsPreferenceLoading - Setter for the preference loading flag.
 * @param setPreferenceError - Setter for the preference request error message.
 */
export async function runLoadPreference(
  setPreference: SetPreference,
  setSavedPreference: SetPreference,
  setFieldErrors: SetFieldErrors,
  setIsPreferenceLoading: SetBooleanState,
  setPreferenceError: SetStringState,
) {
  beginPreferenceRequest(setIsPreferenceLoading, setPreferenceError, setFieldErrors);

  try {
    const nextPreference = await preferenceService.getMyPreference();
    applyLoadedPreference(nextPreference, setPreference, setSavedPreference);
  } catch (error) {
    applyPreferenceRequestError(error, setPreferenceError, setFieldErrors);
  } finally {
    setIsPreferenceLoading(false);
  }
}

/**
 * Validates and saves the current preference values.
 * @param preference - Preference values to save.
 * @param setPreference - Setter for the editable preference state.
 * @param setSavedPreference - Setter for the saved preference snapshot.
 * @param setFieldErrors - Setter for preference field-level errors.
 * @param setIsSaving - Setter for the saving flag.
 * @param setPreferenceError - Setter for the preference error message.
 */
export async function runSavePreference(
  preference: Preference,
  setPreference: SetPreference,
  setSavedPreference: SetPreference,
  setFieldErrors: SetFieldErrors,
  setIsSaving: SetBooleanState,
  setPreferenceError: SetStringState,
) {
  if (hasPreferenceClientErrors(preference, setFieldErrors, setPreferenceError)) {
    return;
  }

  beginPreferenceRequest(setIsSaving, setPreferenceError, setFieldErrors);

  try {
    const updatedPreference = await preferenceService.updateMyPreference(
      buildPreferenceUpdatePayload(preference),
    );
    applyLoadedPreference(updatedPreference, setPreference, setSavedPreference);
  } catch (error) {
    applyPreferenceRequestError(error, setPreferenceError, setFieldErrors);
  } finally {
    setIsSaving(false);
  }
}

/**
 * Loads category settings used by the category-limits section.
 * @param setCategories - Setter for editable categories.
 * @param setSavedCategories - Setter for the saved category snapshot.
 * @param setIsCategoriesLoading - Setter for the category loading flag.
 * @param setCategoriesError - Setter for the category request error message.
 */
export async function runLoadCategories(
  setCategories: SetCategories,
  setSavedCategories: SetCategories,
  setIsCategoriesLoading: SetBooleanState,
  setCategoriesError: SetStringState,
) {
  setIsCategoriesLoading(true);
  setCategoriesError(null);

  try {
    const nextCategories = await categoryService.getCategories();
    setCategories(nextCategories);
    setSavedCategories(nextCategories);
  } catch (error) {
    const parsed = formatDjangoFormError(error);
    setCategoriesError(parsed.message);
  } finally {
    setIsCategoriesLoading(false);
  }
}

/**
 * Saves the current category study limits after normalizing them against scheduling limits.
 * @param categories - Category list to persist.
 * @param preference - Active scheduling preference used to compute max daily minutes.
 * @param setCategories - Setter for editable categories.
 * @param setSavedCategories - Setter for the saved category snapshot.
 * @param setIsSaving - Setter for the saving flag.
 * @param setCategoriesError - Setter for the category error message.
 */
export async function runSaveCategoryLimits(
  categories: Category[],
  preference: Preference | null,
  setCategories: SetCategories,
  setSavedCategories: SetCategories,
  setIsSaving: SetBooleanState,
  setCategoriesError: SetStringState,
) {
  setIsSaving(true);
  setCategoriesError(null);
  const maxDailyMinutes = getSchedulingDayMaxMinutes(preference);

  try {
    const updatedCategories = await Promise.all(
      categories.map((category) =>
        categoryService.updateCategory(category.id, buildCategoryLimitPatch(category, maxDailyMinutes)),
      ),
    );
    setCategories(updatedCategories);
    setSavedCategories(updatedCategories);
  } catch (error) {
    const parsed = formatDjangoFormError(error);
    setCategoriesError(parsed.message);
  } finally {
    setIsSaving(false);
  }
}
