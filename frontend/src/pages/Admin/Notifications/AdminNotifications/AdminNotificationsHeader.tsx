/**
 * Renders the header section for the admin notifications page.
 * @returns Header UI component.
 */
export const AdminNotificationsHeader = () => {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-indigo-600">Admin tools</p>
        <h1 className="text-3xl font-semibold text-gray-900">Admin notifications</h1>
        <p className="mt-2 text-sm text-gray-600">
          Broadcast announcements to all users, staff, admins, or specific accounts.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
          Delivered via push notifications
        </div>
      </div>
    </div>
  );
};
