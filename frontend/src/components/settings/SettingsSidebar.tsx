import type { SettingsSection } from "@/components/settings/types";

interface SettingsSidebarProps {
  state: {
    activeSection: SettingsSection;
  };
  loading: {
    saving: boolean;
  };
  actions: {
    selectSection: (section: SettingsSection) => void;
    logout: () => void;
  };
}

/**
 * Renders the settings navigation sidebar.
 * @param props - Sidebar props.
 * @param props.state - Sidebar state values.
 * @param props.loading - Sidebar loading values.
 * @param props.actions - Sidebar action callbacks.
 * @returns The settings sidebar.
 */
const SettingsSidebar = ({
  state,
  loading,
  actions,
}: SettingsSidebarProps) => {
  const navItems: { label: string; value: SettingsSection }[] = [
    { label: "Profile", value: "profile" },
    { label: "Features", value: "features" },
    { label: "Scheduling", value: "preferences" },
    { label: "Theme", value: "theme" },
  ];

  return (
    <aside className="w-[10%] min-w-35">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {navItems.map((item, index) => {
          const isActive = state.activeSection === item.value;
          return (
            <button
              key={item.value}
              type="button"
              disabled={loading.saving}
              onClick={() => actions.selectSection(item.value)}
              className={`w-full rounded-md px-3 py-2.5 text-left text-base font-semibold transition-colors ${
                index > 0 ? "mt-2 " : ""
              }${
                isActive
                  ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
                  : "text-gray-600 hover:bg-gray-50"
              } disabled:cursor-not-allowed disabled:opacity-70`}
            >
              {item.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={actions.logout}
          className="mt-6 w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          Log out
        </button>
      </div>
    </aside>
  );
};

export default SettingsSidebar;
