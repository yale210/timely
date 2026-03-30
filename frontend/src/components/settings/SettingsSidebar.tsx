import { useState } from "react";
import type { SettingsSection } from "@/components/settings/types";
import ConfirmationModal from "@/components/modals/ConfirmationModal";

interface SettingsSidebarProps {
  mobileLayout?: boolean;
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
  mobileLayout = false,
  state,
  loading,
  actions,
}: SettingsSidebarProps) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navGroups: {
    label: string;
    items: { label: string; value: SettingsSection; icon: string }[];
  }[] = [
    {
      label: "Account",
      items: [
        { label: "Profile", value: "profile", icon: "person" },
        { label: "Privacy", value: "privacy", icon: "lock" },
      ],
    },
    {
      label: "Planning",
      items: [
        { label: "Scheduling", value: "preferences", icon: "schedule" },
        { label: "Categories", value: "categories", icon: "category" },
        { label: "Overrides", value: "overrides", icon: "event_busy" },
      ],
    },
    {
      label: "App",
      items: [
        { label: "General", value: "general", icon: "tune" },
        { label: "Extras", value: "features", icon: "extension" },
      ],
    },
    {
      label: "Appearance",
      items: [
        { label: "Themes", value: "themes", icon: "palette" },
        { label: "Fonts", value: "fonts", icon: "format_size" },
      ],
    },
  ];

  const renderNavButton = (
    item: { label: string; value: SettingsSection; icon: string },
    itemIndex: number,
  ) => {
    const isActive = state.activeSection === item.value;
    if (mobileLayout) {
      return (
        <button
          key={item.value}
          type="button"
          disabled={loading.saving}
          onClick={() => actions.selectSection(item.value)}
          className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold leading-tight transition-colors ${
            isActive
              ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
              : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
          } disabled:cursor-not-allowed disabled:opacity-70`}
        >
          <span className="flex items-center gap-2">
            <span className="material-icons text-base">{item.icon}</span>
            {item.label}
          </span>
        </button>
      );
    }

    return (
      <button
        key={item.value}
        type="button"
        disabled={loading.saving}
        onClick={() => actions.selectSection(item.value)}
        className={`w-full rounded-md px-3 py-2.5 text-left text-base font-semibold transition-colors ${
          itemIndex > 0 ? "mt-2 " : ""
        }${
          isActive
            ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
            : "text-gray-600 hover:bg-gray-50"
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        <span className="flex items-center gap-2">
          <span className="material-icons text-lg">{item.icon}</span>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <aside className={mobileLayout ? "w-full" : "w-56 min-w-56 shrink-0"}>
      <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${mobileLayout ? "p-3" : "p-4"}`}>
        {navGroups.map((group, groupIndex) => (
          <div key={group.label} className={groupIndex > 0 ? (mobileLayout ? "mt-4" : "mt-5") : ""}>
            <p className={`mb-2 font-semibold uppercase text-gray-400 ${
              mobileLayout
                ? "px-1 text-[10px] tracking-[0.18em]"
                : "px-3 text-xs tracking-[0.14em]"
            }`}>
              {group.label}
            </p>
            <div className={mobileLayout ? "grid grid-cols-2 gap-2" : ""}>
              {group.items.map((item, itemIndex) => renderNavButton(item, itemIndex))}
            </div>
          </div>
        ))}
        <div className="my-4 border-t border-gray-200" />
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full text-center text-sm font-semibold text-red-700 hover:bg-red-50 ${
              mobileLayout ? "rounded-lg px-3 py-2.5" : "rounded-md px-3 py-2"
            }`}
          >
            Log out
          </button>
        </div>
      </div>
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={actions.logout}
        title="Log out?"
        message="You will be signed out of your account."
        confirmText="Log out"
        cancelText="Cancel"
      />
    </aside>
  );
};

export default SettingsSidebar;
