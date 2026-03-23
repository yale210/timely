import { AdminSidebarLink } from "./AdminSidebar/AdminSidebarLink";
import { AdminSidebarNavLink } from "./AdminSidebar/AdminSidebarNavLink";

const adminSidebarItems = [
  { label: "Notifications", to: "/admin/notifications", icon: "notifications_active" },
  { label: "Notification History", to: "/admin/notifications/history", icon: "history" },
];

const accountItems = [
  { label: "Settings", to: "/settings", icon: "settings" },
  { label: "Log out", to: "/logout", icon: "logout" },
];

interface AdminSidebarProps {
  onClose: () => void;
}

/**
 * Sidebar drawer content shown when the user is on an admin route.
 * @param props - Component props with close handler.
 * @param props.onClose - Callback invoked when a navigation link is clicked to close the drawer.
 * @returns Sidebar navigation layout.
 */
export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  return (
    <>
      <ul className="space-y-2 px-4 py-4">
        <AdminSidebarLink to="/dashboard" label="Back to Overview" icon="arrow_back" onClose={onClose} />
      </ul>
      <div className="mx-4 border-t-2 border-gray-200" />
      <ul className="flex-1 space-y-2 px-4 py-4">
        {adminSidebarItems.map((item) => (
          <AdminSidebarNavLink key={item.to} {...item} onClose={onClose} />
        ))}
      </ul>
      <div className="mx-4 border-t-2 border-gray-200" />
      <ul className="space-y-2 px-4 py-4">
        {accountItems.map((item) => (
          <AdminSidebarLink key={item.to} {...item} onClose={onClose} />
        ))}
      </ul>
    </>
  );
}
