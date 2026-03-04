import { NotificationCard } from "@/components/notifications/NotificationCard";
import { NotificationType } from "@/types/notification";

interface AdminLivePreviewProps {
  title: string;
  message: string;
}

/**
 * Shows a live notification preview while the admin composes a message.
 * @param props - Preview title and message values.
 * @returns A preview card matching notification rendering.
 */
export const AdminLivePreview = (props: AdminLivePreviewProps) => {
  const { title, message } = props;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Live preview</h2>
      <p className="mt-1 text-xs text-gray-500">Mirrors notification rendering logic.</p>
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
        <NotificationCard
          notification={{
            id: -1,
            recipient: -1,
            sender: null,
            sender_username: null,
            title: title || "Notification title preview",
            message: message || "Notification body preview will appear here.",
            is_read: false,
            timestamp: new Date().toISOString(),
            notification_type: NotificationType.SYSTEM,
          }}
          onClick={() => undefined}
          compact
        />
      </div>
    </div>
  );
};
