import { useState, type Dispatch, type SetStateAction } from "react";
import type { SettingsSection } from "@/components/settings/types";
import type { Category, Preference } from "@/types";

/**
 * Core mutable settings state used to compose the public settings hook.
 */
export interface SettingsCoreState {
  activeSection: SettingsSection;
  setActiveSection: Dispatch<SetStateAction<SettingsSection>>;
  preference: Preference | null;
  setPreference: Dispatch<SetStateAction<Preference | null>>;
  savedPreference: Preference | null;
  setSavedPreference: Dispatch<SetStateAction<Preference | null>>;
  categories: Category[];
  setCategories: Dispatch<SetStateAction<Category[]>>;
  savedCategories: Category[];
  setSavedCategories: Dispatch<SetStateAction<Category[]>>;
  fieldErrors: Record<string, string[]>;
  setFieldErrors: Dispatch<SetStateAction<Record<string, string[]>>>;
}

/**
 * Internal loading flags used by the settings domain hooks.
 */
export interface SettingsLoadingState {
  isPreferenceLoading: boolean;
  setIsPreferenceLoading: Dispatch<SetStateAction<boolean>>;
  isCategoriesLoading: boolean;
  setIsCategoriesLoading: Dispatch<SetStateAction<boolean>>;
  isSaving: boolean;
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  isDeleting: boolean;
  setIsDeleting: Dispatch<SetStateAction<boolean>>;
}

/**
 * Internal error state used by the settings domain hooks.
 */
export interface SettingsErrorState {
  preferenceError: string | null;
  setPreferenceError: Dispatch<SetStateAction<string | null>>;
  categoriesError: string | null;
  setCategoriesError: Dispatch<SetStateAction<string | null>>;
}

function useSettingsCoreState(): SettingsCoreState {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [preference, setPreference] = useState<Preference | null>(null);
  const [savedPreference, setSavedPreference] = useState<Preference | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [savedCategories, setSavedCategories] = useState<Category[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  return {
    activeSection,
    setActiveSection,
    preference,
    setPreference,
    savedPreference,
    setSavedPreference,
    categories,
    setCategories,
    savedCategories,
    setSavedCategories,
    fieldErrors,
    setFieldErrors,
  };
}

function useSettingsLoadingState(): SettingsLoadingState {
  const [isPreferenceLoading, setIsPreferenceLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return {
    isPreferenceLoading,
    setIsPreferenceLoading,
    isCategoriesLoading,
    setIsCategoriesLoading,
    isSaving,
    setIsSaving,
    isDeleting,
    setIsDeleting,
  };
}

function useSettingsErrorState(): SettingsErrorState {
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  return {
    preferenceError,
    setPreferenceError,
    categoriesError,
    setCategoriesError,
  };
}

/**
 * Builds the grouped state slices used by the settings hook orchestration layer.
 * @returns Core settings state plus loading and error state groups.
 */
export function useSettingsStateBundle() {
  return {
    core: useSettingsCoreState(),
    loading: useSettingsLoadingState(),
    errors: useSettingsErrorState(),
  };
}
