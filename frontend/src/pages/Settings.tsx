import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import { authService } from "../services/authService";

/**
 * Basic settings page placeholder.
 * @returns The rendered settings page.
 */
type SettingsSection = "profile" | "preferences" | "theme" | "features";

const Settings = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const navigate = useNavigate();

  const renderContent = () => {
    if (activeSection === "preferences") {
      return (
        <>
          <h2 className="text-lg font-semibold">Scheduling</h2>
          <p className="mt-2 text-sm text-gray-600">
            Preferences controls will go here.
          </p>
        </>
      );
    }

    if (activeSection === "theme") {
      return (
        <>
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="mt-2 text-sm text-gray-600">
            Theme options will go here.
          </p>
        </>
      );
    }

    if (activeSection === "features") {
      return (
        <>
          <h2 className="text-lg font-semibold">Features</h2>
          <p className="mt-2 text-sm text-gray-600">
            Feature toggles will go here.
          </p>
        </>
      );
    }

    return (
      <>
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-2 text-sm text-gray-600">
          Profile settings will go here.
        </p>
      </>
    );
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
            <aside className="w-[10%] min-w-[140px]">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() => setActiveSection("profile")}
                  className={`w-full text-left text-sm font-medium rounded-md px-3 py-2 transition-colors ${
                    activeSection === "profile"
                      ? "bg-blue-50 text-primary"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("features")}
                  className={`mt-2 w-full text-left text-sm font-medium rounded-md px-3 py-2 transition-colors ${
                    activeSection === "features"
                      ? "bg-blue-50 text-primary"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Features
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("preferences")}
                  className={`mt-2 w-full text-left text-sm font-medium rounded-md px-3 py-2 transition-colors ${
                    activeSection === "preferences"
                      ? "bg-blue-50 text-primary"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Scheduling
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("theme")}
                  className={`mt-2 w-full text-left text-sm font-medium rounded-md px-3 py-2 transition-colors ${
                    activeSection === "theme"
                      ? "bg-blue-50 text-primary"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Theme
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void authService.logout().then(() => {
                      navigate("/login");
                    });
                  }}
                  className="mt-6 w-full text-left text-sm font-semibold rounded-md px-3 py-2 text-red-700 hover:bg-red-50"
                >
                  Log out
                </button>
              </div>
            </aside>
            <section className="flex-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {renderContent()}
            </section>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Settings;
