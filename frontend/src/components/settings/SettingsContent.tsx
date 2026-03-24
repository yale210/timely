import { useMemo, useState } from "react";
import PreferencesSection from "@/components/settings/PreferencesSection";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import ThemeSection from "@/components/settings/ThemeSection";
import ProfileSection from "@/components/settings/ProfileSection";
import CategoryLimitsSection from "@/components/settings/CategoryLimitsSection";
import type { UseSettingsReturn } from "@/hooks/settings/useSettings";
import { useProfileSettings } from "@/hooks/settings/useProfileSettings";
import { getSchedulingDayMaxMinutes } from "@/utils/schedulingLimits";

interface SettingsContentProps {
  state: UseSettingsReturn["state"];
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
  const dragSnapOptions = [5, 10, 15, 20, 30, 60] as const;
  const [featureFlags, setFeatureFlags] = useState(() => ({
    gradebook: localStorage.getItem("feature_gradebook_enabled") !== "false",
    leaderboard: localStorage.getItem("feature_leaderboard_enabled") !== "false",
    pomodoro: localStorage.getItem("feature_pomodoro_enabled") !== "false",
  }));

  const featureRows = useMemo(() => ([
    {
      key: "pomodoro",
      label: "Pomodoro",
      description: "A focus timer that alternates work sessions with short and long breaks.",
      value: featureFlags.pomodoro,
    },
    {
      key: "gradebook",
      label: "Gradebook",
      description: "Track and review your grades over time.",
      value: featureFlags.gradebook,
    },
    {
      key: "leaderboard",
      label: "Leaderboard",
      description: "Allows users to view how they are doing in comparison to their friends.",
      value: featureFlags.leaderboard,
    },
  ]), [featureFlags]);

  const updateFeature = (key: "gradebook" | "leaderboard" | "pomodoro", value: boolean) => {
    if (key === "gradebook") {
      localStorage.setItem("feature_gradebook_enabled", String(value));
    } else if (key === "leaderboard") {
      localStorage.setItem("feature_leaderboard_enabled", String(value));
    } else {
      localStorage.setItem("feature_pomodoro_enabled", String(value));
    }
    setFeatureFlags((prev) => ({ ...prev, [key]: value }));
    window.dispatchEvent(new Event("feature-flags-changed"));
  };

  const profileState = useProfileSettings(state.activeSection === "profile");
  const isWideSection = state.activeSection === "appearance";
  const categoryLimitMaxMinutes = useMemo(
    () => getSchedulingDayMaxMinutes(state.preference),
    [state.preference],
  );

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account and preferences.
          </p>
        </div>
      </header>
      <main className="p-6">
        <div className="flex gap-6">
          <SettingsSidebar
            state={{ activeSection: state.activeSection }}
            loading={{ saving: loading.saving }}
            actions={{
              selectSection: actions.selectSection,
              logout: () => {
                void actions.logout();
              },
            }}
          />
          <section
            className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${
              isWideSection ? "min-w-0 flex-1" : "w-full md:w-1/2"
            }`}
          >
            {state.activeSection === "preferences" ? (
              <PreferencesSection
                pref={state.preference}
                prefLoading={loading.preference}
                prefSaving={loading.saving}
                prefError={error.preference}
                fieldErrors={state.fieldErrors}
                onPrefChange={actions.setPreference}
                onSave={() => {
                  void actions.savePreferences();
                }}
              />
            ) : null}
            {state.activeSection === "appearance" ? (
              <ThemeSection
                onThemeChange={actions.applyTheme}
                onFontChange={actions.applyFont}
              />
            ) : null}
            {state.activeSection === "categories" ? (
              <CategoryLimitsSection
                categories={state.categories}
                maxDailyMinutes={categoryLimitMaxMinutes}
                loading={loading.categories}
                saving={loading.saving}
                error={error.categories}
                onLimitChange={actions.setCategoryLimit}
                onSave={() => {
                  void actions.saveCategoryLimits();
                }}
              />
            ) : null}
            {state.activeSection === "features" ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Features</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Toggle optional sections of the app.
                  </p>
                </div>
                <div className="space-y-4">
                  {featureRows.map((feature) => (
                    <label
                      key={feature.key}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{feature.label}</p>
                        <p className="text-xs text-gray-500">{feature.description}</p>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={feature.value}
                        onChange={(event) => {
                          updateFeature(
                            feature.key as "gradebook" | "leaderboard" | "pomodoro",
                            event.target.checked,
                          );
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            {state.activeSection === "general" ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">General</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage shared app behavior settings.
                  </p>
                </div>
                {loading.preference ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : (() => {
                  const preference = state.preference;
                  if (!preference) {
                    return <p className="text-sm text-red-600">Unable to load preferences.</p>;
                  }

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-sm font-semibold text-gray-900">Sound effects</p>
                        <button
                          type="button"
                          onClick={() => {
                            actions.setPreference({
                              ...preference,
                              disable_sound_effects: !preference.disable_sound_effects,
                            });
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            preference.disable_sound_effects ? "bg-gray-300" : "bg-primary"
                          }`}
                          aria-pressed={!preference.disable_sound_effects}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                              preference.disable_sound_effects ? "translate-x-1" : "translate-x-4"
                            }`}
                          />
                        </button>
                      </div>
                      <div>
                        <label
                          htmlFor="general-drag-snap-minutes"
                          className="block text-sm font-medium text-gray-900"
                        >
                          Calendar drag timeslot
                        </label>
                        <p className="mt-1 text-xs text-gray-500">
                          Controls how task drag and resize actions snap on the calendar.
                        </p>
                        <select
                          id="general-drag-snap-minutes"
                          value={preference.drag_snap_minutes}
                          onChange={(event) => {
                            actions.setPreference({
                              ...preference,
                              drag_snap_minutes: Number(event.target.value) as 5 | 10 | 15 | 20 | 30 | 60,
                            });
                          }}
                          className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none"
                        >
                          {dragSnapOptions.map((minutes) => (
                            <option key={minutes} value={minutes}>
                              {minutes} minutes
                            </option>
                          ))}
                        </select>
                        {state.fieldErrors.drag_snap_minutes?.length ? (
                          <div className="mt-1 text-xs text-red-700">
                            {state.fieldErrors.drag_snap_minutes.join(" ")}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            void actions.savePreferences();
                          }}
                          disabled={loading.saving}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                            loading.saving
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-primary text-white hover:bg-blue-300"
                          }`}
                        >
                          {loading.saving ? "Saving..." : "Save changes"}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : null}
            {state.activeSection === "profile" ? (
              <ProfileSection
                profile={profileState.state.profile}
                loading={profileState.state.loading}
                saving={profileState.state.saving}
                error={profileState.state.error}
                fieldErrors={profileState.state.fieldErrors}
                onChange={profileState.actions.setProfile}
                onAvatarChange={profileState.actions.setAvatarFile}
                onSave={() => {
                  void profileState.actions.saveProfile();
                }}
              />
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
};

export default SettingsContent;
