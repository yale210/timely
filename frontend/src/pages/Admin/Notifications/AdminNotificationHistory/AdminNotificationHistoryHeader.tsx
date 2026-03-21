interface AdminNotificationHistoryHeaderProps {
  /**
   * Callback to navigate to the new notification creation page.
   */
  onNewNotification: () => void;
}

/**
 * Renders the header section for the notification history page.
 * @param props - Action callbacks.
 * @returns Header UI component.
 */
export const AdminNotificationHistoryHeader = (props: AdminNotificationHistoryHeaderProps) => {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-indigo-600">Admin tools</p>
        <h1 className="text-3xl font-semibold text-gray-900">Notification history</h1>
        <p className="mt-2 text-sm text-gray-600">Review all notification broadcasts.</p>
      </div>
      <button
        type="button"
        onClick={props.onNewNotification}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        New notification
      </button>
    </div>
  );
};
