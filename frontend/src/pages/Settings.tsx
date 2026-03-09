import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import { authService } from "@/services/authService";
import { preferenceService } from "@/services/preferenceService";
import type { Preference } from "@/types";
import PlaceholderSection from "@/components/settings/PlaceholderSection";
import PreferencesSection from "@/components/settings/PreferencesSection";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import ThemeSection from "@/components/settings/ThemeSection";
import type { SettingsSection } from "@/components/settings/types";
import { formatDjangoFormError } from "@/utils/apiErrors";
import { validatePreference } from "@/utils/preferenceValidation";
import { applyFont, applyTheme } from "@/utils/themeSettings";

/**
 * Basic settings page placeholder.
 * @returns The rendered settings page.
 */

const Settings = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const navigate = useNavigate();

  const [pref, setPref] = useState<Preference | null>(null);
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefError, setPrefError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleLogout = () => {
    void (async () => {
      try {
        await authService.logout();
      } catch {
        // ignore logout failures and still navigate
      } finally {
        await navigate("/login");
      }
    })();
  };

  useEffect(() => {
    if (activeSection !== "preferences") {
      return;
    }

    setPrefLoading(true);
    setPrefError(null);
    setFieldErrors({});

    void preferenceService.getMyPreference()
      .then((data: Preference) => setPref(data))
      .catch((error: unknown) => {
        const parsed = formatDjangoFormError(error);
        setPrefError(parsed.message);
        setFieldErrors(parsed.fieldErrors);
      })
      .finally(() => setPrefLoading(false));
  }, [activeSection]);

  const savePreferences = async () => {
    if (!pref) {
      return;
    }

    const clientErrors = validatePreference(pref);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setPrefError("Please fix the highlighted fields.");
      return;
    }

    setPrefSaving(true);
    setPrefError(null);
    setFieldErrors({});

    try {
      const updated = await preferenceService.updateMyPreference({
        day_start: pref.day_start.slice(0, 5),
        day_end: pref.day_end.slice(0, 5),
        max_hours_study_per_day: pref.max_hours_study_per_day,
        days_off: pref.days_off,
      });
      setPref(updated);
    } catch (error) {
      const parsed = formatDjangoFormError(error);
      setPrefError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
    } finally {
      setPrefSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-white text-black">
        <header className="border-b border-gray-200 bg-white">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your account and preferences.
            </p>
          </div>
        </header>
        <main className="p-6">
          <div className="flex gap-6">
            <SettingsSidebar
              activeSection={activeSection}
              onSelect={setActiveSection}
              onLogout={handleLogout}
            />
            <section className="flex-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {activeSection === "preferences" && (
                <PreferencesSection
                  pref={pref}
                  prefLoading={prefLoading}
                  prefSaving={prefSaving}
                  prefError={prefError}
                  fieldErrors={fieldErrors}
                  onPrefChange={(next) => setPref(next)}
                  onSave={() => void savePreferences()}
                />
              )}
              {activeSection === "theme" && (
                <ThemeSection
                  onThemeChange={applyTheme}
                  onFontChange={applyFont}
                />
              )}
              {activeSection === "features" && (
                <PlaceholderSection
                  title="Features"
                  description="Feature toggles will go here."
                />
              )}
              {activeSection === "profile" && (
                <PlaceholderSection
                  title="Profile"
                  description="Profile settings will go here."
                />
              )}
            </section>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Settings;
