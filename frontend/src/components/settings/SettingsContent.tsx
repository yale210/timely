import { useMemo, useState } from "react";
import PlaceholderSection from "@/components/settings/PlaceholderSection";
import PreferencesSection from "@/components/settings/PreferencesSection";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import ThemeSection from "@/components/settings/ThemeSection";
import type { UseSettingsReturn } from "@/hooks/settings/useSettings";

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
  const [featureFlags, setFeatureFlags] = useState(() => ({
    gradebook: localStorage.getItem("feature_gradebook_enabled") !== "false",
    weeklySummaries: localStorage.getItem("feature_weekly_summaries_enabled") !== "false",
  }));

  const featureRows = useMemo(() => ([
    {
      key: "gradebook",
      label: "Gradebook",
      description: "Show Gradebook in the navigation and dashboard.",
      value: featureFlags.gradebook,
    },
    {
      key: "weeklySummaries",
      label: "Weekly Summaries",
      description: "Show Weekly Summaries in the navigation.",
      value: featureFlags.weeklySummaries,
    },
  ]), [featureFlags]);

  const updateFeature = (key: "gradebook" | "weeklySummaries", value: boolean) => {
    if (key === "gradebook") {
      localStorage.setItem("feature_gradebook_enabled", String(value));
    } else {
      localStorage.setItem("feature_weekly_summaries_enabled", String(value));
    }
    setFeatureFlags((prev) => ({ ...prev, [key]: value }));
    window.dispatchEvent(new Event("feature-flags-changed"));
  };

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
          <section className="flex-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
            {state.activeSection === "theme" ? (
              <ThemeSection
                onThemeChange={actions.applyTheme}
                onFontChange={actions.applyFont}
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
                          updateFeature(feature.key as "gradebook" | "weeklySummaries", event.target.checked);
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            {state.activeSection === "profile" ? (
              <PlaceholderSection
                title="Profile"
                description="Profile settings will go here."
              />
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
};

export default SettingsContent;
