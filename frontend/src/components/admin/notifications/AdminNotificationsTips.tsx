import { InformationCircleIcon } from "@heroicons/react/24/outline";

/**
 * Renders static broadcast tips for admin users.
 * @returns Broadcast tips UI component.
 */
export const AdminNotificationsTips = () => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Broadcast tips</h2>
      <ul className="mt-3 space-y-3 text-sm text-gray-600">
        <li className="flex gap-2">
          <InformationCircleIcon className="mt-0.5 h-4 w-4 text-indigo-500" />
          Keep messages concise (title up to 60 chars, body up to 240 chars).
        </li>
        <li className="flex gap-2">
          <InformationCircleIcon className="mt-0.5 h-4 w-4 text-indigo-500" />
          Validate your audience before confirming send.
        </li>
        <li className="flex gap-2">
          <InformationCircleIcon className="mt-0.5 h-4 w-4 text-indigo-500" />
          Push notifications are delivered immediately after queueing.
        </li>
      </ul>
    </div>
  );
};
