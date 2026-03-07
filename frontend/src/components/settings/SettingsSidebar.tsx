import type { SettingsSection } from "@/components/settings/types";

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSelect: (section: SettingsSection) => void;
  onLogout: () => void;
}

const SettingsSidebar = ({
  activeSection,
  onSelect,
  onLogout,
}: SettingsSidebarProps) => (
  <aside className="w-[10%] min-w-35">
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => onSelect("profile")}
        className={`w-full text-left text-base font-semibold rounded-md px-3 py-2.5 transition-colors ${
          activeSection === "profile"
            ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        Profile
      </button>
      <button
        type="button"
        onClick={() => onSelect("features")}
        className={`mt-2 w-full text-left text-base font-semibold rounded-md px-3 py-2.5 transition-colors ${
          activeSection === "features"
            ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        Features
      </button>
      <button
        type="button"
        onClick={() => onSelect("preferences")}
        className={`mt-2 w-full text-left text-base font-semibold rounded-md px-3 py-2.5 transition-colors ${
          activeSection === "preferences"
            ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        Scheduling
      </button>
      <button
        type="button"
        onClick={() => onSelect("theme")}
        className={`mt-2 w-full text-left text-base font-semibold rounded-md px-3 py-2.5 transition-colors ${
          activeSection === "theme"
            ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        Theme
      </button>
      <button
        type="button"
        onClick={onLogout}
        className="mt-6 w-full text-left text-sm font-semibold rounded-md px-3 py-2 text-red-700 hover:bg-red-50"
      >
        Log out
      </button>
    </div>
  </aside>
);

export default SettingsSidebar;
