import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PreferencesSection from "@/components/settings/PreferencesSection";
import OverridesSection from "@/components/settings/OverridesSection";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import ThemeSection from "@/components/settings/ThemeSection";
import ProfileSection from "@/components/settings/ProfileSection";
import CategoryLimitsSection from "@/components/settings/CategoryLimitsSection";
import PrivacySection from "@/components/settings/PrivacySection";
import SettingsFeatureSection from "@/components/settings/SettingsFeatureSection";
import SettingsGeneralSection from "@/components/settings/SettingsGeneralSection";
import { useTeacher } from "@/hooks/course/useTeacher";
import type { UseSettingsReturn } from "@/hooks/settings/useSettings";
import { useProfileSettings } from "@/hooks/settings/useProfileSettings";
import { makeMyTeacherProfile, unregisterMyTeacherProfile } from "@/services/courseService.ts";
import { getSchedulingDayMaxMinutes } from "@/utils/schedulingLimits";

interface SettingsContentProps {
  state: Omit<UseSettingsReturn["state"], "isPreferenceDirty" | "areCategoryLimitsDirty"> & {
    isPreferenceDirty?: boolean;
    areCategoryLimitsDirty?: boolean;
  };
  loading: UseSettingsReturn["loading"];
  error: UseSettingsReturn["error"];
  actions: UseSettingsReturn["actions"];
}

/**
 * Renders the settings page layout and selected section content.
 * @param props - Settings content props.
 * @param props.state - Settings state values.
 * @param props.loading - Settings loading values.
 * @param props.error - Settings error values.
 * @param props.actions - Settings action callbacks.
 * @returns The presentational settings page content.
 */
const SettingsContent = ({
  state,
  loading,
  error,
  actions,
}: SettingsContentProps) => {
  const [makingTeacher, setMakingTeacher] = useState(false);
  const [unregisteringTeacher, setUnregisteringTeacher] = useState(false);
  const [makeTeacherError, setMakeTeacherError] = useState<string | null>(null);
  const [makeTeacherSuccess, setMakeTeacherSuccess] = useState<string | null>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const mobileSectionRef = useRef<HTMLElement | null>(null);
  const shouldScrollToSectionRef = useRef(false);
  const teacherState = useTeacher();

  const makeTeacher = async () => {
    if (makingTeacher) return;

    setMakeTeacherError(null);
    setMakeTeacherSuccess(null);
    setMakingTeacher(true);

    try {
      await makeMyTeacherProfile();
      await teacherState.reload?.();
      setMakeTeacherSuccess("You are now registered as a teacher.");
    } catch (error: unknown) {
      console.error("Failed to create teacher profile:", error);
      setMakeTeacherError("Unable to make you a teacher.");
    } finally {
      setMakingTeacher(false);
    }
  };

  const unregisterTeacher = async () => {
    if (unregisteringTeacher) return;

    setMakeTeacherError(null);
    setMakeTeacherSuccess(null);
    setUnregisteringTeacher(true);

    try {
      await unregisterMyTeacherProfile();
      await teacherState.reload?.();
      setMakeTeacherSuccess("You are no longer registered as a teacher.");
    } catch (error: unknown) {
      console.error("Failed to unregister teacher profile:", error);
      setMakeTeacherError("Unable to unregister you as a teacher.");
    } finally {
      setUnregisteringTeacher(false);
    }
  };

  const profileState = useProfileSettings(state.activeSection === "profile");
  const isWideSection = state.activeSection === "themes" || state.activeSection === "fonts";
  const sectionContentClass = "w-full";
  const sectionPanelClass = isWideSection
    ? "min-w-0 flex-1"
    : "min-w-0 w-full max-w-2xl";
  const categoryLimitMaxMinutes = useMemo(
    () => getSchedulingDayMaxMinutes(state.preference),
    [state.preference],
  );

  useEffect(() => {
    const syncViewport = () => {
      setIsMobileLayout(window.innerWidth < 768);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  const scrollMobileSectionIntoView = useCallback(() => {
    if (!isMobileLayout) {
      return;
    }
    const section = mobileSectionRef.current;
    if (!section || typeof section.scrollIntoView !== "function") {
      return;
    }
    window.requestAnimationFrame(() => {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [isMobileLayout]);

  const handleSelectSection = (section: typeof state.activeSection) => {
    if (isMobileLayout) {
      if (section === state.activeSection) {
        scrollMobileSectionIntoView();
        return;
      }
      shouldScrollToSectionRef.current = true;
    }
    actions.selectSection(section);
  };

  useEffect(() => {
    if (!isMobileLayout || !shouldScrollToSectionRef.current) {
      return;
    }
    shouldScrollToSectionRef.current = false;
    scrollMobileSectionIntoView();
  }, [isMobileLayout, scrollMobileSectionIntoView, state.activeSection]);

  return (
    <div className="settings-page min-h-screen bg-white text-black">
      <header className="border-b border-gray-200 bg-white">
        <div className="px-4 py-4 sm:px-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account and preferences.
          </p>
        </div>
      </header>
      <main className="px-3 py-4 sm:p-6">
        {isMobileLayout ? (
          <div className="space-y-4">
            <SettingsSidebar
              mobileLayout={true}
              state={{ activeSection: state.activeSection }}
              loading={{ saving: loading.saving }}
              actions={{
                selectSection: handleSelectSection,
                logout: () => {
                  void actions.logout();
                },
              }}
            />
            <section
              ref={mobileSectionRef}
              className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${
                isWideSection ? "w-full" : "w-full"
              }`}
            >
              <div className={sectionContentClass}>
                {state.activeSection === "preferences" ? (
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
                ) : null}
                {state.activeSection === "overrides" ? <OverridesSection /> : null}
                {state.activeSection === "themes" ? (
                  <ThemeSection
                    onThemeChange={actions.applyTheme}
                    onFontChange={actions.applyFont}
                    mode="themes"
                  />
                ) : null}
                {state.activeSection === "fonts" ? (
                  <ThemeSection
                    onThemeChange={actions.applyTheme}
                    onFontChange={actions.applyFont}
                    mode="fonts"
                  />
                ) : null}
                {state.activeSection === "categories" ? (
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
                ) : null}
                {state.activeSection === "features" ? <SettingsFeatureSection /> : null}
                {state.activeSection === "general" ? (
                  <SettingsGeneralSection
                    preference={state.preference}
                    loadingPreference={loading.preference}
                    saving={loading.saving}
                    isPreferenceDirty={state.isPreferenceDirty ?? false}
                    fieldErrors={state.fieldErrors}
                    onPreferenceChange={actions.setPreference}
                    onSave={actions.savePreferences}
                  />
                ) : null}
                {state.activeSection === "profile" ? (
                  <ProfileSection
                    profile={profileState.state.profile}
                    loading={profileState.state.loading}
                    saving={profileState.state.saving}
                    isDirty={profileState.state.isDirty}
                    error={profileState.state.error}
                    fieldErrors={profileState.state.fieldErrors}
                    teacherActionLoading={{
                      makingTeacher,
                      unregisteringTeacher,
                      teacherStatus: teacherState.loading,
                    }}
                    teacherActionState={{
                      error: makeTeacherError,
                      success: makeTeacherSuccess,
                    }}
                    isTeacher={teacherState.isTeacher}
                    onChange={profileState.actions.setProfile}
                    onAvatarChange={profileState.actions.setAvatarFile}
                    onToggleTeacher={(nextValue) => {
                      if (nextValue) {
                        void makeTeacher();
                        return;
                      }

                      void unregisterTeacher();
                    }}
                    onSave={() => {
                      void profileState.actions.saveProfile();
                    }}
                  />
                ) : null}
                {state.activeSection === "privacy" ? (
                  <PrivacySection
                    deleting={false}
                    onDeleteEvents={() => {
                      return actions.deleteEvents();
                    }}
                    onDeleteTasks={() => {
                      return actions.deleteTasks();
                    }}
                    onDeleteAccount={() => {
                      return actions.deleteAccount();
                    }}
                  />
                ) : null}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex items-start gap-6">
            <SettingsSidebar
              state={{ activeSection: state.activeSection }}
              loading={{ saving: loading.saving }}
              actions={{
                selectSection: handleSelectSection,
                logout: () => {
                  void actions.logout();
                },
              }}
            />
            <section
              className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${
                sectionPanelClass
              }`}
            >
              <div className={sectionContentClass}>
                {state.activeSection === "preferences" ? (
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
                ) : null}
                {state.activeSection === "overrides" ? <OverridesSection /> : null}
                {state.activeSection === "themes" ? (
                  <ThemeSection
                    onThemeChange={actions.applyTheme}
                    onFontChange={actions.applyFont}
                    mode="themes"
                  />
                ) : null}
                {state.activeSection === "fonts" ? (
                  <ThemeSection
                    onThemeChange={actions.applyTheme}
                    onFontChange={actions.applyFont}
                    mode="fonts"
                  />
                ) : null}
                {state.activeSection === "categories" ? (
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
                ) : null}
                {state.activeSection === "features" ? <SettingsFeatureSection /> : null}
                {state.activeSection === "general" ? (
                  <SettingsGeneralSection
                    preference={state.preference}
                    loadingPreference={loading.preference}
                    saving={loading.saving}
                    isPreferenceDirty={state.isPreferenceDirty ?? false}
                    fieldErrors={state.fieldErrors}
                    onPreferenceChange={actions.setPreference}
                    onSave={actions.savePreferences}
                  />
                ) : null}
                {state.activeSection === "profile" ? (
                  <ProfileSection
                    profile={profileState.state.profile}
                    loading={profileState.state.loading}
                    saving={profileState.state.saving}
                    isDirty={profileState.state.isDirty}
                    error={profileState.state.error}
                    fieldErrors={profileState.state.fieldErrors}
                    teacherActionLoading={{
                      makingTeacher,
                      unregisteringTeacher,
                      teacherStatus: teacherState.loading,
                    }}
                    teacherActionState={{
                      error: makeTeacherError,
                      success: makeTeacherSuccess,
                    }}
                    isTeacher={teacherState.isTeacher}
                    onChange={profileState.actions.setProfile}
                    onAvatarChange={profileState.actions.setAvatarFile}
                    onToggleTeacher={(nextValue) => {
                      if (nextValue) {
                        void makeTeacher();
                        return;
                      }

                      void unregisterTeacher();
                    }}
                    onSave={() => {
                      void profileState.actions.saveProfile();
                    }}
                  />
                ) : null}
                {state.activeSection === "privacy" ? (
                  <PrivacySection
                    deleting={false}
                    onDeleteEvents={() => {
                      return actions.deleteEvents();
                    }}
                    onDeleteTasks={() => {
                      return actions.deleteTasks();
                    }}
                    onDeleteAccount={() => {
                      return actions.deleteAccount();
                    }}
                  />
                ) : null}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default SettingsContent;
