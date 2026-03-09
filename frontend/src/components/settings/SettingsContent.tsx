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
}: SettingsContentProps) => (
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
            <PlaceholderSection
              title="Features"
              description="Feature toggles will go here."
            />
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

export default SettingsContent;
