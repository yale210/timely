import { useCallback, useEffect } from "react";
import type { NavigateFunction } from "react-router-dom";
import { authService } from "@/services/authService";
import { deleteEvents as deleteEventsAPI, deleteTasks as deleteTasksAPI } from "@/services/taskService";
import { applyFont, applyTheme } from "@/utils/themeSettings";
import { getSchedulingDayMaxMinutes } from "@/utils/schedulingLimits";
import type { Preference } from "@/types";
import {
  runLoadCategories,
  runLoadPreference,
  runSaveCategoryLimits,
  runSavePreference,
  shouldLoadPreferenceForSection,
  updateCategoryLimitValue,
} from "./settingsPersistence";
import type {
  SettingsActions,
  SettingsError,
  SettingsLoading,
  SettingsState,
  UseSettingsReturn,
} from "./settingsTypes";
import type {
  SettingsCoreState,
  SettingsErrorState,
  SettingsLoadingState,
} from "./useSettingsState";

function noopSettingsAction(): Promise<void> {
  return Promise.resolve();
}

function useSettingsNavigationActions(
  isSaving: boolean,
  setActiveSection: SettingsCoreState["setActiveSection"],
  navigate: NavigateFunction,
) {
  const selectSection = useCallback((section: SettingsState["activeSection"]) => {
    if (isSaving) {
      return;
    }

    setActiveSection(section);
  }, [isSaving, setActiveSection]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout failures and still navigate
    } finally {
      void navigate("/login");
    }
  }, [navigate]);

  return { selectSection, logout };
}

function useSettingsDeletionActions(
  setIsDeleting: SettingsLoadingState["setIsDeleting"],
) {
  const deleteEvents = useCallback(async () => {
    setIsDeleting(true);
    try {
      return await deleteEventsAPI();
    } finally {
      setIsDeleting(false);
    }
  }, [setIsDeleting]);

  const deleteTasks = useCallback(async () => {
    setIsDeleting(true);
    try {
      return await deleteTasksAPI();
    } finally {
      setIsDeleting(false);
    }
  }, [setIsDeleting]);

  const deleteAccount = useCallback(async () => {
    setIsDeleting(true);
    try {
      const message = await authService.deleteAccount();
      await authService.logout();
      return message;
    } finally {
      setIsDeleting(false);
    }
  }, [setIsDeleting]);

  return { deleteEvents, deleteTasks, deleteAccount };
}

function useLoadPreferenceAction(
  core: SettingsCoreState,
  loading: SettingsLoadingState,
  errors: SettingsErrorState,
) {
  return useCallback(
    () =>
      runLoadPreference(
        core.setPreference,
        core.setSavedPreference,
        core.setFieldErrors,
        loading.setIsPreferenceLoading,
        errors.setPreferenceError,
      ),
    [
      core.setFieldErrors,
      core.setPreference,
      core.setSavedPreference,
      errors.setPreferenceError,
      loading.setIsPreferenceLoading,
    ],
  );
}

function useSavePreferencesAction(
  preference: Preference | null,
  core: SettingsCoreState,
  loading: SettingsLoadingState,
  errors: SettingsErrorState,
) {
  return useCallback(async () => {
    if (!preference) {
      return;
    }

    await runSavePreference(
      preference,
      core.setPreference,
      core.setSavedPreference,
      core.setFieldErrors,
      loading.setIsSaving,
      errors.setPreferenceError,
    );
  }, [
    preference,
    core.setFieldErrors,
    core.setPreference,
    core.setSavedPreference,
    errors.setPreferenceError,
    loading.setIsSaving,
  ]);
}

function useLoadCategoriesAction(
  core: SettingsCoreState,
  loading: SettingsLoadingState,
  errors: SettingsErrorState,
) {
  return useCallback(
    () =>
      runLoadCategories(
        core.setCategories,
        core.setSavedCategories,
        loading.setIsCategoriesLoading,
        errors.setCategoriesError,
      ),
    [
      core.setCategories,
      core.setSavedCategories,
      errors.setCategoriesError,
      loading.setIsCategoriesLoading,
    ],
  );
}

function useSetCategoryLimitAction(
  preference: Preference | null,
  setCategories: SettingsCoreState["setCategories"],
) {
  return useCallback((categoryId: number, value: number | null) => {
    const maxDailyMinutes = getSchedulingDayMaxMinutes(preference);
    setCategories((prev) => prev.map((category) => (
      category.id === categoryId
        ? {
          ...category,
          max_daily_study_time: updateCategoryLimitValue(value, maxDailyMinutes),
        }
        : category
    )));
  }, [preference, setCategories]);
}

function useSaveCategoryLimitsAction(
  categories: SettingsCoreState["categories"],
  preference: Preference | null,
  core: SettingsCoreState,
  loading: SettingsLoadingState,
  errors: SettingsErrorState,
) {
  return useCallback(
    () =>
      runSaveCategoryLimits(
        categories,
        preference,
        core.setCategories,
        core.setSavedCategories,
        loading.setIsSaving,
        errors.setCategoriesError,
      ),
    [
      categories,
      preference,
      core.setCategories,
      core.setSavedCategories,
      errors.setCategoriesError,
      loading.setIsSaving,
    ],
  );
}

/**
 * Runs section-driven data loading effects for preferences and category limits.
 * @param activeSection - Currently selected settings section.
 * @param loadPreference - Preference loading action.
 * @param loadCategories - Category loading action.
 */
export function useSettingsDataEffects(
  activeSection: SettingsState["activeSection"],
  loadPreference: () => Promise<void>,
  loadCategories: () => Promise<void>,
) {
  useEffect(() => {
    if (!shouldLoadPreferenceForSection(activeSection)) {
      return;
    }

    void loadPreference();
  }, [activeSection, loadPreference]);

  useEffect(() => {
    if (activeSection !== "categories") {
      return;
    }

    void loadCategories();
  }, [activeSection, loadCategories]);
}

function buildSettingsState(core: SettingsCoreState): SettingsState {
  return {
    activeSection: core.activeSection,
    preference: core.preference,
    categories: core.categories,
    fieldErrors: core.fieldErrors,
    isPreferenceDirty:
      JSON.stringify(core.preference) !== JSON.stringify(core.savedPreference),
    areCategoryLimitsDirty:
      JSON.stringify(core.categories) !== JSON.stringify(core.savedCategories),
  };
}

function buildSettingsLoading(loading: SettingsLoadingState): SettingsLoading {
  return {
    preference: loading.isPreferenceLoading,
    categories: loading.isCategoriesLoading,
    saving: loading.isSaving,
    deleting: loading.isDeleting,
  };
}

function buildSettingsError(errors: SettingsErrorState): SettingsError {
  return {
    preference: errors.preferenceError,
    categories: errors.categoriesError,
  };
}

/**
 * Builds the public settings hook result from the internal state groups and actions.
 * @param core - Core settings state values.
 * @param loading - Internal loading flags.
 * @param errors - Internal error state.
 * @param actions - Public settings actions.
 * @returns Structured settings hook state, loading, errors, and actions.
 */
export function buildUseSettingsResult(
  core: SettingsCoreState,
  loading: SettingsLoadingState,
  errors: SettingsErrorState,
  actions: SettingsActions,
): UseSettingsReturn {
  return {
    state: buildSettingsState(core),
    loading: buildSettingsLoading(loading),
    error: buildSettingsError(errors),
    actions,
  };
}

/**
 * Creates the global settings actions unrelated to a single data domain.
 * @param navigate - Router navigation function.
 * @param core - Core settings state values.
 * @param loading - Internal loading flags.
 * @returns Global settings actions such as navigation, logout, deletion, and theme updates.
 */
export function useSettingsGlobalActions(
  navigate: NavigateFunction,
  core: SettingsCoreState,
  loading: SettingsLoadingState,
) {
  const { selectSection, logout } = useSettingsNavigationActions(
    loading.isSaving,
    core.setActiveSection,
    navigate,
  );
  const { deleteEvents, deleteTasks, deleteAccount } = useSettingsDeletionActions(
    loading.setIsDeleting,
  );

  return {
    selectSection,
    logout,
    deleteEvents,
    deleteTasks,
    deleteAccount,
    applyTheme,
    applyFont,
    makeTeacher: noopSettingsAction,
    unregisterTeacher: noopSettingsAction,
  };
}

function usePreferenceActions(
  core: SettingsCoreState,
  loading: SettingsLoadingState,
  errors: SettingsErrorState,
) {
  const loadPreference = useLoadPreferenceAction(core, loading, errors);
  const savePreferences = useSavePreferencesAction(
    core.preference,
    core,
    loading,
    errors,
  );

  return {
    loadPreference,
    actions: {
      setPreference: core.setPreference as (nextPreference: Preference) => void,
      savePreferences,
    },
  };
}

function useCategoryActions(
  core: SettingsCoreState,
  loading: SettingsLoadingState,
  errors: SettingsErrorState,
) {
  const loadCategories = useLoadCategoriesAction(core, loading, errors);
  const setCategoryLimit = useSetCategoryLimitAction(
    core.preference,
    core.setCategories,
  );
  const saveCategoryLimits = useSaveCategoryLimitsAction(
    core.categories,
    core.preference,
    core,
    loading,
    errors,
  );

  return {
    loadCategories,
    actions: {
      setCategoryLimit,
      saveCategoryLimits,
    },
  };
}

/**
 * Creates the settings actions and data loaders for preferences and category limits.
 * @param core - Core settings state values.
 * @param loading - Internal loading flags.
 * @param errors - Internal error state.
 * @returns Domain-specific settings actions plus the data loaders used by the outer hook.
 */
export function useSettingsDomainActions(
  core: SettingsCoreState,
  loading: SettingsLoadingState,
  errors: SettingsErrorState,
) {
  const preferenceActions = usePreferenceActions(core, loading, errors);
  const categoryActions = useCategoryActions(core, loading, errors);

  return {
    loadPreference: preferenceActions.loadPreference,
    loadCategories: categoryActions.loadCategories,
    actions: {
      ...preferenceActions.actions,
      ...categoryActions.actions,
    },
  };
}
