import type { SettingsSection } from "@/components/settings/types";
import type { Category, Preference } from "@/types";

/**
 * Public settings state exposed to settings consumers.
 */
export interface SettingsState {
  activeSection: SettingsSection;
  preference: Preference | null;
  categories: Category[];
  fieldErrors: Record<string, string[]>;
  isPreferenceDirty: boolean;
  areCategoryLimitsDirty: boolean;
}

/**
 * Loading flags exposed by the settings hook.
 */
export interface SettingsLoading {
  preference: boolean;
  categories: boolean;
  saving: boolean;
  deleting: boolean;
}

/**
 * Error state exposed by the settings hook.
 */
export interface SettingsError {
  preference: string | null;
  categories: string | null;
}

/**
 * Actions exposed by the settings hook.
 */
export interface SettingsActions {
  selectSection: (section: SettingsSection) => void;
  setPreference: (nextPreference: Preference) => void;
  setCategoryLimit: (categoryId: number, value: number | null) => void;
  savePreferences: () => Promise<void>;
  saveCategoryLimits: () => Promise<void>;
  logout: () => Promise<void>;
  applyTheme: (themeName: string) => void;
  applyFont: (fontName: string) => void;
  deleteEvents: () => Promise<string>;
  deleteTasks: () => Promise<string>;
  deleteAccount: () => Promise<string>;
  makeTeacher: () => Promise<void>;
  unregisterTeacher: () => Promise<void>;
}

/**
 * Structured return shape for the settings hook.
 */
export interface UseSettingsReturn {
  state: SettingsState;
  loading: SettingsLoading;
  error: SettingsError;
  actions: SettingsActions;
}
