import type React from "react";
import { CheckCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { type NotificationFilterTab, filterTabs } from "@/hooks/notifications/useNotificationsPage";

interface NotificationsHeaderProps {
  activeTab: NotificationFilterTab;
  onTabChange: (tab: NotificationFilterTab) => void;
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
}

/**
 * Renders the filter tabs for notifications.
 * @param root0 - The component props.
 * @param root0.activeTab - Active tab.
 * @param root0.onTabChange - Tab change handler.
 */
const NotificationFilterTabs: React.FC<{
  activeTab: NotificationFilterTab;
  onTabChange: (tab: NotificationFilterTab) => void;
}> = ({ activeTab, onTabChange }) => (
  <div className="mt-3 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
    {filterTabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        onClick={() => onTabChange(tab.key)}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          activeTab === tab.key ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

/**
 * Renders the bulk actions for notifications.
 * @param root0 - The component props.
 * @param root0.onMarkAllRead - Mark all read handler.
 * @param root0.onDeleteAll - Delete all handler.
 */
const NotificationBulkActions: React.FC<{
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
}> = ({ onMarkAllRead, onDeleteAll }) => (
  <div className="mb-1 flex items-center gap-1 self-start sm:self-auto">
    <button type="button" title="Mark all as read" aria-label="Mark all as read" onClick={onMarkAllRead} className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
      <CheckCircleIcon className="h-5 w-5" />
    </button>
    <button type="button" title="Delete all" aria-label="Delete all" onClick={onDeleteAll} className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
      <TrashIcon className="h-5 w-5" />
    </button>
  </div>
);

/**
 * Renders notifications page heading, filters, and bulk actions.
 * @param root0 - The component props.
 * @param root0.activeTab - Active tab.
 * @param root0.onTabChange - Tab change handler.
 * @param root0.onMarkAllRead - Mark all read handler.
 * @param root0.onDeleteAll - Delete all handler.
 */
export const NotificationsHeader: React.FC<NotificationsHeaderProps> = ({
  activeTab,
  onTabChange,
  onMarkAllRead,
  onDeleteAll,
}) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
      <NotificationFilterTabs activeTab={activeTab} onTabChange={onTabChange} />
    </div>
    <NotificationBulkActions onMarkAllRead={onMarkAllRead} onDeleteAll={onDeleteAll} />
  </div>
);
