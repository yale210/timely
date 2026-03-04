import { CheckCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { type NotificationFilterTab, filterTabs } from "@/hooks/notifications/useNotificationsPage";

interface NotificationsHeaderProps {
  activeTab: NotificationFilterTab;
  onTabChange: (tab: NotificationFilterTab) => void;
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
}

/**
 * Renders notifications page heading, filters, and bulk actions.
 * @param props - Active filter tab and header action callbacks.
 * @returns The notifications list header section.
 */
export const NotificationsHeader = (props: NotificationsHeaderProps) => {
  const { activeTab, onTabChange, onMarkAllRead, onDeleteAll } = props;

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <div className="mt-3 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-1 flex items-center gap-1 self-start sm:self-auto">
        <button
          type="button"
          title="Mark all as read"
          aria-label="Mark all as read"
          onClick={onMarkAllRead}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <CheckCircleIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          title="Delete all"
          aria-label="Delete all"
          onClick={onDeleteAll}
          className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
