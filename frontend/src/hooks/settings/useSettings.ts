import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SettingsSection } from "@/components/settings/types";
import { authService } from "@/services/authService";
import { preferenceService } from "@/services/preferenceService";
import type { Preference } from "@/types";
import { formatDjangoFormError } from "@/utils/apiErrors";
import { validatePreference } from "@/utils/preferenceValidation";
import { applyFont, applyTheme } from "@/utils/themeSettings";

interface SettingsState {
  activeSection: SettingsSection;
  preference: Preference | null;
  fieldErrors: Record<string, string[]>;
}

interface SettingsLoading {
  preference: boolean;
  saving: boolean;
}

interface SettingsError {
  preference: string | null;
}

interface SettingsActions {
  selectSection: (section: SettingsSection) => void;
  setPreference: (nextPreference: Preference) => void;
  savePreferences: () => Promise<void>;
  logout: () => Promise<void>;
  applyTheme: (themeName: string) => void;
  applyFont: (fontName: string) => void;
}

/**
 * Describes the structured settings hook contract.
 */
export interface UseSettingsReturn {
  state: SettingsState;
  loading: SettingsLoading;
  error: SettingsError;
  actions: SettingsActions;
}

/**
 * Provides settings section navigation, preference persistence, and account actions.
 * @returns Structured settings state, loading, error, and actions.
 */
export const useSettings = (): UseSettingsReturn => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [preference, setPreference] = useState<Preference | null>(null);
  const [isPreferenceLoading, setIsPreferenceLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const selectSection = useCallback(
    (section: SettingsSection) => {
      if (isSaving) {
        return;
      }

      setActiveSection(section);
    },
    [isSaving],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout failures and still navigate
    } finally {
      await navigate("/login");
    }
  }, [navigate]);

  const loadPreference = useCallback(async () => {
    setIsPreferenceLoading(true);
    setPreferenceError(null);
    setFieldErrors({});

    try {
      const nextPreference = await preferenceService.getMyPreference();
      setPreference(nextPreference);
      localStorage.setItem(
        "disable_sound_effects",
        String(nextPreference.disable_sound_effects ?? false),
      );
    } catch (error) {
      const parsed = formatDjangoFormError(error);
      setPreferenceError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
    } finally {
      setIsPreferenceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection !== "preferences" && activeSection !== "general") {
      return;
    }

    void loadPreference();
  }, [activeSection, loadPreference]);

  const savePreferences = useCallback(async () => {
    if (!preference) {
      return;
    }

    const clientErrors = validatePreference(preference);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setPreferenceError("Please fix the highlighted fields.");
      return;
    }

    setIsSaving(true);
    setPreferenceError(null);
    setFieldErrors({});

    try {
      const updatedPreference = await preferenceService.updateMyPreference({
        day_start: preference.day_start.slice(0, 5),
        day_end: preference.day_end.slice(0, 5),
        day_schedule: preference.day_schedule,
        max_hours_study_per_day: preference.max_hours_study_per_day,
        limit_max_hours: preference.limit_max_hours,
        disable_sound_effects: preference.disable_sound_effects,
        days_off: preference.days_off,
      });
      setPreference(updatedPreference);
      localStorage.setItem(
        "disable_sound_effects",
        String(updatedPreference.disable_sound_effects ?? false),
      );
    } catch (error) {
      const parsed = formatDjangoFormError(error);
      setPreferenceError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
    } finally {
      setIsSaving(false);
    }
  }, [preference]);

  return {
    state: {
      activeSection,
      preference,
      fieldErrors,
    },
    loading: {
      preference: isPreferenceLoading,
      saving: isSaving,
    },
    error: {
      preference: preferenceError,
    },
    actions: {
      selectSection,
      setPreference,
      savePreferences,
      logout,
      applyTheme,
      applyFont,
    },
  };
};

