import { type FormEvent, useMemo, useState, useEffect, useCallback } from "react";
import { InformationCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import {
  getAdminUsers,
  sendAdminNotification,
  getAudienceCounts,
  getBroadcastStatus,
} from "../api/notifications";
import {
  type AdminNotificationPayload,
  type AdminNotificationTarget,
  type AdminUserRole,
  type AdminUserSummary,
  type BroadcastDeliveryStatus,
  type BroadcastJobStatusResponse,
  type ApiErrorResponse,
  NotificationType,
} from "../types/notification";
import { NotificationCard } from "../components/NotificationCard";
import ConfirmationModal from "../components/ConfirmationModal";

const USERS_PAGE_SIZE = 50;
const TITLE_LIMIT = 60;
const MESSAGE_LIMIT = 240;
const POLL_INTERVAL_MS = 3000;

const targetOptions: { label: string; value: AdminNotificationTarget }[] = [
  { label: "All users", value: "all" },
  { label: "Staff", value: "staff" },
  { label: "Admins", value: "admin" },
  { label: "Specific users", value: "users" },
];

const normalizeUserIds = (rawValue: string): number[] =>
  rawValue
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);

const isTerminalStatus = (status: BroadcastDeliveryStatus) =>
  status === "COMPLETED" || status === "PARTIAL" || status === "FAILED";

const parseApiError = (error: unknown): string => {
  const maybeError = error as { response?: { data?: ApiErrorResponse } };
  return maybeError.response?.data?.error?.message ?? "Failed to send admin notification.";
};

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<AdminNotificationTarget>("all");
  const [userIdsInput, setUserIdsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminUserRole>("all");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [usersCount, setUsersCount] = useState(0);
  const [hasUsersNextPage, setHasUsersNextPage] = useState(false);
  const [hasUsersPreviousPage, setHasUsersPreviousPage] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");
  const [audienceCounts, setAudienceCounts] = useState({
    all: 0,
    staff: 0,
    admin: 0,
    selected_users: 0,
  });
  const [currentBroadcastId, setCurrentBroadcastId] = useState<number | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<BroadcastJobStatusResponse | null>(null);

  const parsedUserIds = useMemo(() => normalizeUserIds(userIdsInput), [userIdsInput]);
  const selectedIdsForPayload = useMemo(
    () => (selectedUserIds.length > 0 ? selectedUserIds : parsedUserIds),
    [parsedUserIds, selectedUserIds],
  );
  const isAllVisibleSelected =
    users.length > 0 && users.every((user) => selectedUserIds.includes(user.id));

  const targetAudienceCount = useMemo(() => {
    if (target === "all") {
      return audienceCounts.all;
    }
    if (target === "staff") {
      return audienceCounts.staff;
    }
    if (target === "admin") {
      return audienceCounts.admin;
    }
    return audienceCounts.selected_users;
  }, [audienceCounts, target]);

  const validation = useMemo(() => {
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();
    const hasTitle = trimmedTitle.length > 0;
    const hasMessage = trimmedMessage.length > 0;
    const validTitleLength = trimmedTitle.length <= TITLE_LIMIT;
    const validMessageLength = trimmedMessage.length <= MESSAGE_LIMIT;
    const hasUsersTarget =
      target !== "users" || (selectedIdsForPayload.length > 0 && targetAudienceCount > 0);

    return {
      trimmedTitle,
      trimmedMessage,
      hasTitle,
      hasMessage,
      validTitleLength,
      validMessageLength,
      hasUsersTarget,
    };
  }, [title, message, target, selectedIdsForPayload.length, targetAudienceCount]);

  const canSubmit =
    validation.hasTitle &&
    validation.hasMessage &&
    validation.validTitleLength &&
    validation.validMessageLength &&
    validation.hasUsersTarget &&
    targetAudienceCount > 0 &&
    confirmationChecked;

  const loadAudienceCounts = useCallback(async () => {
    try {
      const counts = await getAudienceCounts(selectedIdsForPayload);
      setAudienceCounts(counts);
    } catch (countsError) {
      console.error("Failed to fetch audience counts", countsError);
    }
  }, [selectedIdsForPayload]);

  useEffect(() => {
    void loadAudienceCounts();
  }, [loadAudienceCounts]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPreviewTitle(title.trim());
      setPreviewMessage(message.trim());
    }, 200);
    return () => clearTimeout(timeout);
  }, [title, message]);

  useEffect(() => {
    setUsersPage(1);
  }, [search, roleFilter, target]);

  useEffect(() => {
    if (target !== "users") {
      setSelectedUserIds([]);
      setUserIdsInput("");
    }
  }, [target]);

  useEffect(() => {
    if (target !== "users") {
      setUsers([]);
      setUsersCount(0);
      setHasUsersNextPage(false);
      setHasUsersPreviousPage(false);
      return;
    }

    const loadUsers = async () => {
      try {
        setIsUsersLoading(true);
        setUsersError(null);
        const data = await getAdminUsers({
          search,
          role: roleFilter,
          page: usersPage,
          pageSize: USERS_PAGE_SIZE,
        });
        setUsers(data.results);
        setUsersCount(data.count);
        setHasUsersNextPage(Boolean(data.next));
        setHasUsersPreviousPage(Boolean(data.previous));
      } catch (usersLoadError) {
        console.error("Failed to load users", usersLoadError);
        setUsersError("Failed to load users.");
      } finally {
        setIsUsersLoading(false);
      }
    };

    void loadUsers();
  }, [roleFilter, search, target, usersPage]);

  useEffect(() => {
    if (!currentBroadcastId || !deliveryStatus || isTerminalStatus(deliveryStatus.status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void getBroadcastStatus(currentBroadcastId)
        .then((status) => {
          setDeliveryStatus(status);
        })
        .catch((statusError) => {
          console.error("Failed to poll broadcast status", statusError);
        });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [currentBroadcastId, deliveryStatus]);

  const toggleSelectAll = (shouldSelect: boolean) => {
    if (shouldSelect) {
      setSelectedUserIds((prev) => {
        const userIdSet = new Set(prev);
        for (const user of users) {
          userIdSet.add(user.id);
        }
        return Array.from(userIdSet);
      });
    } else {
      const currentPageIds = new Set(users.map((user) => user.id));
      setSelectedUserIds((prev) => prev.filter((id) => !currentPageIds.has(id)));
    }
  };

  const toggleUserSelection = (userId: number, shouldSelect: boolean) => {
    setSelectedUserIds((prev) => {
      if (shouldSelect) {
        if (prev.includes(userId)) {
          return prev;
        }
        return [...prev, userId];
      }
      return prev.filter((id) => id !== userId);
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError("Please complete all required fields and confirmation.");
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSend = async () => {
    const payload: AdminNotificationPayload = {
      title: validation.trimmedTitle,
      message: validation.trimmedMessage,
      target,
      user_ids: target === "users" ? selectedIdsForPayload : undefined,
    };

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await sendAdminNotification(payload);
      setCurrentBroadcastId(response.broadcast_id);
      const queuedStatus: BroadcastJobStatusResponse = {
        id: response.broadcast_id,
        status: response.status,
        recipient_count: response.recipient_count,
        delivered_count: 0,
        failed_count: 0,
        queued_at: response.queued_at,
        started_at: null,
        completed_at: null,
        task_id: response.task_id,
        updated_at: response.queued_at,
      };
      setDeliveryStatus(queuedStatus);
      const statusResponse = await getBroadcastStatus(response.broadcast_id);
      setDeliveryStatus(statusResponse);
    } catch (submitError) {
      console.error("Failed to send admin notification", submitError);
      setError(parseApiError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusLabel = deliveryStatus?.status ?? "IDLE";
  const statusTone =
    deliveryStatus?.status === "FAILED"
      ? "text-red-600"
      : deliveryStatus?.status === "PARTIAL"
      ? "text-amber-600"
      : deliveryStatus?.status === "COMPLETED"
      ? "text-emerald-600"
      : "text-indigo-600";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <span
                  className={`text-xs ${
                    title.trim().length > TITLE_LIMIT ? "text-red-600" : "text-gray-400"
                  }`}
                >
                  {title.trim().length}/{TITLE_LIMIT}
                </span>
              </div>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Semester update"
                maxLength={TITLE_LIMIT}
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <span
                  className={`text-xs ${
                    message.trim().length > MESSAGE_LIMIT ? "text-red-600" : "text-gray-400"
                  }`}
                >
                  {message.trim().length}/{MESSAGE_LIMIT}
                </span>
              </div>
              <textarea
                id="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={6}
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Share the latest update with the community."
                maxLength={MESSAGE_LIMIT}
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="target" className="block text-sm font-medium text-gray-700">
                Target audience
              </label>
              <select
                id="target"
                value={target}
                onChange={(event) => setTarget(event.target.value as AdminNotificationTarget)}
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                disabled={isSubmitting}
              >
                {targetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                    {option.value === "all" ? ` (${audienceCounts.all})` : ""}
                    {option.value === "staff" ? ` (${audienceCounts.staff})` : ""}
                    {option.value === "admin" ? ` (${audienceCounts.admin})` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">Estimated recipients: {targetAudienceCount}</p>
            </div>

            {target === "users" && (
              <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Select recipients</h2>
                    <p className="text-xs text-gray-500">
                      Search users and pick one or more recipients below.
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">{selectedUserIds.length} selected</div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                  <div className="relative">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400">
                      search
                    </span>
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Search by username or email"
                      disabled={isSubmitting}
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value as AdminUserRole)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  >
                    <option value="all">All roles</option>
                    <option value="users">Users</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>

                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="max-h-72 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="sticky top-0 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isAllVisibleSelected}
                              onChange={(event) => toggleSelectAll(event.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              disabled={isSubmitting}
                            />
                          </th>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {isUsersLoading && (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                              Loading users...
                            </td>
                          </tr>
                        )}
                        {!isUsersLoading && usersError && (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-sm text-red-600">
                              {usersError}
                            </td>
                          </tr>
                        )}
                        {!isUsersLoading && !usersError && users.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                              No users match your search.
                            </td>
                          </tr>
                        )}
                        {!isUsersLoading &&
                          !usersError &&
                          users.map((user) => {
                            const isSelected = selectedUserIds.includes(user.id);
                            const roleLabel = user.is_superuser
                              ? "Admin"
                              : user.is_staff
                              ? "Staff"
                              : "User";
                            return (
                              <tr key={user.id} className={isSelected ? "bg-indigo-50" : "bg-white"}>
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(event) =>
                                      toggleUserSelection(user.id, event.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    disabled={isSubmitting}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-900">{user.username}</div>
                                  <div className="text-xs text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                                    {roleLabel}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                      user.is_active
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-gray-100 text-gray-500"
                                    }`}
                                  >
                                    {user.is_active ? "Active" : "Inactive"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Page {usersPage} of {Math.max(1, Math.ceil(usersCount / USERS_PAGE_SIZE))}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUsersPage((prev) => Math.max(1, prev - 1))}
                      disabled={!hasUsersPreviousPage || isUsersLoading || isSubmitting}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setUsersPage((prev) => prev + 1)}
                      disabled={!hasUsersNextPage || isUsersLoading || isSubmitting}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <label htmlFor="user-ids" className="block text-xs font-medium text-gray-600">
                    Or paste user IDs
                  </label>
                  <input
                    id="user-ids"
                    type="text"
                    value={userIdsInput}
                    onChange={(event) => setUserIdsInput(event.target.value)}
                    className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-xs shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="12, 48, 150"
                    disabled={isSubmitting}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    The table selection takes priority if any users are checked.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-md border border-indigo-200 bg-indigo-50/50 px-4 py-3">
              <label className="flex items-start gap-2 text-sm text-indigo-900">
                <input
                  type="checkbox"
                  checked={confirmationChecked}
                  onChange={(event) => setConfirmationChecked(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
                <span>
                  I confirm that this broadcast is ready to send to the selected audience.
                </span>
              </label>
            </div>

            {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send notification"}
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
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
                  title: previewTitle || "Notification title preview",
                  message: previewMessage || "Notification body preview will appear here.",
                  is_read: false,
                  timestamp: new Date().toISOString(),
                  notification_type: NotificationType.SYSTEM,
                }}
                onClick={() => undefined}
                compact
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Delivery status</h2>
              <Link
                to="/admin/notifications/history"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                title="Notification history"
              >
                <ClockIcon className="h-5 w-5" />
              </Link>
            </div>
            {deliveryStatus ? (
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-gray-600">
                  Broadcast ID: <span className="font-medium text-gray-800">{deliveryStatus.id}</span>
                </p>
                <p className={statusTone}>
                  Status: <span className="font-semibold">{statusLabel}</span>
                </p>
                <p className="text-gray-600">
                  Delivered: {deliveryStatus.delivered_count}/{deliveryStatus.recipient_count}
                </p>
                <p className="text-gray-600">Failed: {deliveryStatus.failed_count}</p>
                <p className="text-xs text-gray-500">Task ID: {deliveryStatus.task_id}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No broadcasts queued yet.</p>
            )}
          </div>

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
        </aside>
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          void handleConfirmSend();
        }}
        title="Send this broadcast?"
        message={`You are about to notify ${targetAudienceCount} recipients.`}
        confirmText="Send now"
      />
    </div>
  );
}
