import { Link } from "react-router-dom";

interface AdminNotificationHistoryDetailHeaderProps {
  /**
   * Title of the broadcast.
   */
  title: string;
  /**
   * ISO string of when the broadcast was queued.
   */
  queuedAt: string;
  /**
   * Number of recipients that failed delivery.
   */
  failedRecipientsCount: number;
  /**
   * Callback to open the retry confirmation modal.
   */
  onRetryClick: () => void;
}

/**
 * Renders the header section for the notification history detail page.
 * @param props - Header state and action callbacks.
 * @returns Header UI component.
 */
export const AdminNotificationHistoryDetailHeader = (
  props: AdminNotificationHistoryDetailHeaderProps
) => {
  const { title, queuedAt, failedRecipientsCount, onRetryClick } = props;

  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <Link
          to="/admin/notifications/history"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to history
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Queued {new Date(queuedAt).toLocaleString()}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetryClick}
        disabled={failedRecipientsCount === 0}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Retry failed recipients
      </button>
    </div>
  );
};
