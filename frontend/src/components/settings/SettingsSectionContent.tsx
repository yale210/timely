import PreferencesSection from "@/components/settings/PreferencesSection";
import OverridesSection from "@/components/settings/OverridesSection";
import ThemeSection from "@/components/settings/ThemeSection";
import ProfileSection from "@/components/settings/ProfileSection";
import CategoryLimitsSection from "@/components/settings/CategoryLimitsSection";
import PrivacySection from "@/components/settings/PrivacySection";
import SettingsFeatureSection from "@/components/settings/SettingsFeatureSection";
import SettingsGeneralSection from "@/components/settings/SettingsGeneralSection";
import type { Profile } from "@/types";
import type { UseSettingsReturn } from "@/hooks/settings/useSettings";

interface SettingsSectionContentProps {
  state: Omit<UseSettingsReturn["state"], "isPreferenceDirty" | "areCategoryLimitsDirty"> & {
    isPreferenceDirty?: boolean;
    areCategoryLimitsDirty?: boolean;
  };
  loading: UseSettingsReturn["loading"];
  error: UseSettingsReturn["error"];
  actions: UseSettingsReturn["actions"];
  categoryLimitMaxMinutes: number;
  profileState: {
    state: {
      profile: Profile | null;
      loading: boolean;
      saving: boolean;
      isDirty: boolean;
      error: string | null;
      fieldErrors: Record<string, string[]>;
    };
    actions: {
      setProfile: (profile: Profile) => void;
      setAvatarFile: (file: File | null) => void;
      saveProfile: () => Promise<void>;
    };
  };
  teacherActionLoading: {
    makingTeacher: boolean;
    unregisteringTeacher: boolean;
    teacherStatus: boolean;
  };
  teacherActionState: {
    error: string | null;
    success: string | null;
  };
  isTeacher?: boolean;
  onToggleTeacher: (nextValue: boolean) => void;
}

/**
 * Renders the currently selected settings section.
 * @param props - Settings section content props.
 * @returns The active settings section component.
 */
export default function SettingsSectionContent({
  state,
  loading,
  error,
  actions,
  categoryLimitMaxMinutes,
  profileState,
  teacherActionLoading,
  teacherActionState,
  isTeacher,
  onToggleTeacher,
}: SettingsSectionContentProps) {
  if (state.activeSection === "preferences") {
    return (
      <PreferencesSection
        key={state.preference?.id ?? "preferences"}
        pref={state.preference}
        prefLoading={loading.preference}
        prefSaving={loading.saving}
        prefDirty={state.isPreferenceDirty ?? false}
        prefError={error.preference}
        fieldErrors={state.fieldErrors}
        onPrefChange={actions.setPreference}
        onSave={() => {
          void actions.savePreferences();
        }}
      />
    );
  }

  if (state.activeSection === "overrides") return <OverridesSection />;

  if (state.activeSection === "themes") {
    return (
      <ThemeSection
        onThemeChange={actions.applyTheme}
        onFontChange={actions.applyFont}
        mode="themes"
      />
    );
  }

  if (state.activeSection === "fonts") {
    return (
      <ThemeSection
        onThemeChange={actions.applyTheme}
        onFontChange={actions.applyFont}
        mode="fonts"
      />
    );
  }

  if (state.activeSection === "categories") {
    return (
      <CategoryLimitsSection
        categories={state.categories}
        maxDailyMinutes={categoryLimitMaxMinutes}
        loading={loading.categories}
        saving={loading.saving}
        hasChanges={state.areCategoryLimitsDirty ?? false}
        error={error.categories}
        onLimitChange={actions.setCategoryLimit}
        onSave={() => {
          void actions.saveCategoryLimits();
        }}
      />
    );
  }

  if (state.activeSection === "features") return <SettingsFeatureSection />;

  if (state.activeSection === "general") {
    return (
      <SettingsGeneralSection
        preference={state.preference}
        loadingPreference={loading.preference}
        saving={loading.saving}
        isPreferenceDirty={state.isPreferenceDirty ?? false}
        fieldErrors={state.fieldErrors}
        onPreferenceChange={actions.setPreference}
        onSave={actions.savePreferences}
      />
    );
  }

  if (state.activeSection === "profile") {
    return (
      <ProfileSection
        profile={profileState.state.profile}
        loading={profileState.state.loading}
        saving={profileState.state.saving}
        isDirty={profileState.state.isDirty}
        error={profileState.state.error}
        fieldErrors={profileState.state.fieldErrors}
        teacherActionLoading={teacherActionLoading}
        teacherActionState={teacherActionState}
        isTeacher={isTeacher}
        onChange={profileState.actions.setProfile}
        onAvatarChange={profileState.actions.setAvatarFile}
        onToggleTeacher={onToggleTeacher}
        onSave={() => {
          void profileState.actions.saveProfile();
        }}
      />
    );
  }

  if (state.activeSection === "privacy") {
    return (
      <PrivacySection
        deleting={false}
        onDeleteEvents={() => actions.deleteEvents()}
        onDeleteTasks={() => actions.deleteTasks()}
        onDeleteAccount={() => actions.deleteAccount()}
      />
    );
  }

  return null;
}
