import { type FormEvent, useMemo, useState, useEffect } from "react";
import { getAdminUsers, sendAdminNotification } from "../api/notifications";
import {
  type AdminNotificationPayload,
  type AdminNotificationTarget,
  type AdminUserRole,
  type AdminUserSummary,
} from "../types/notification";

const targetOptions: { label: string; value: AdminNotificationTarget }[] = [
  { label: "All users", value: "all" },
  { label: "Staff", value: "staff" },
  { label: "Specific users", value: "users" },
];
const USERS_PAGE_SIZE = 50;

const normalizeUserIds = (rawValue: string): number[] => {
  return rawValue
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
};

/**
 * A page component for administrators to send notifications to users.
 *
 * This component provides an interface to broadcast messages to all users,
 * staff members, or specific individuals. It includes tools to search for
 * and select target users.
 * @returns The rendered admin notification page.
 */
export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<AdminNotificationTarget>("all");
  const [userIdsInput, setUserIdsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  const parsedUserIds = useMemo(() => normalizeUserIds(userIdsInput), [userIdsInput]);
  const hasValidUserIds = target !== "users" || selectedUserIds.length > 0 || parsedUserIds.length > 0;
  const isAllVisibleSelected =
    users.length > 0 && users.every((user) => selectedUserIds.includes(user.id));

  useEffect(() => {
    setUsersPage(1);
  }, [search, roleFilter, target]);

  useEffect(() => {
    const loadUsers = async () => {
      if (target !== "users") {
        setUsers([]);
        setUsersCount(0);
        setHasUsersNextPage(false);
        setHasUsersPreviousPage(false);
        return;
      }

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
      } catch (err) {
        console.error("Failed to load users", err);
        setUsersError("Failed to load users.");
      } finally {
        setIsUsersLoading(false);
      }
    };

    void loadUsers();
  }, [search, roleFilter, target, usersPage]);

  useEffect(() => {
    if (target !== "users") {
      setSelectedUserIds([]);
      setUserIdsInput("");
    }
  }, [target]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!trimmedTitle || !trimmedMessage) {
      setError("Title and message are required.");
      return;
    }

    if (!hasValidUserIds) {
      setError("Please provide at least one valid user ID.");
      return;
    }

    const targetUserIds = selectedUserIds.length > 0 ? selectedUserIds : parsedUserIds;
    const payload: AdminNotificationPayload = {
      title: trimmedTitle,
      message: trimmedMessage,
      target,
      user_ids: target === "users" ? targetUserIds : undefined,
    };

    try {
      setIsSubmitting(true);
      const response = await sendAdminNotification(payload);
      setTitle("");
      setMessage("");
      setUserIdsInput("");
      setSuccessMessage(`Notification queued. Task ID: ${response.task_id}`);
    } catch (err) {
      console.error("Failed to send admin notification", err);
      setError("Failed to send admin notification.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Admin tools</p>
          <h1 className="text-3xl font-semibold text-gray-900">Admin notifications</h1>
          <p className="mt-2 text-sm text-gray-600">
            Broadcast announcements to all users, staff, or specific accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
            Delivered via push notifications
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
          <form
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
            className="space-y-6"
          >
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Semester update"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Share the latest update with the community."
              required
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
            >
              {targetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
                <div className="text-xs text-gray-500">
                  {selectedUserIds.length} selected
                </div>
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
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value as AdminUserRole)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
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
                                  onChange={(event) => toggleUserSelection(user.id, event.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
                    disabled={!hasUsersPreviousPage || isUsersLoading}
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsersPage((prev) => prev + 1)}
                    disabled={!hasUsersNextPage || isUsersLoading}
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
                />
                <p className="mt-2 text-xs text-gray-500">
                  The table selection takes priority if any users are checked.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-60"
            >
              {isSubmitting ? "Sending..." : "Send notification"}
            </button>
          </div>
        </form>
        </div>

        <aside className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Broadcast tips</h2>
          <ul className="mt-3 space-y-3 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="material-icons text-base text-indigo-500">campaign</span>
              Keep messages concise (title 2-4 words, body 1-2 sentences).
            </li>
            <li className="flex gap-2">
              <span className="material-icons text-base text-indigo-500">group</span>
              Use role filters to avoid sending the wrong announcement to all users.
            </li>
            <li className="flex gap-2">
              <span className="material-icons text-base text-indigo-500">schedule</span>
              Push notifications are sent immediately; double-check the content before sending.
            </li>
          </ul>
          <div className="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-xs text-indigo-700">
              Admin broadcasts require staff permissions. If you cannot see users, check your admin role.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
