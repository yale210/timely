import { type AdminNotificationTarget, type AdminUserRole, type AdminUserSummary } from "@/types";

interface AdminUserTableProps {
  target: AdminNotificationTarget;
  users: AdminUserSummary[];
  selectedUserIds: number[];
  usersPage: number;
  usersCount: number;
  usersPageSize: number;
  search: string;
  roleFilter: AdminUserRole;
  userIdsInput: string;
  hasUsersNextPage: boolean;
  hasUsersPreviousPage: boolean;
  isUsersLoading: boolean;
  usersError: string | null;
  isSubmitting: boolean;
  isAllVisibleSelected: boolean;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: AdminUserRole) => void;
  onUsersPageChange: (page: number) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleUserSelection: (userId: number, checked: boolean) => void;
  onUserIdsInputChange: (value: string) => void;
}

/**
 * Renders user selection controls when targeting specific users.
 * @param props - User list, selection state, and update callbacks.
 * @returns Recipient selection UI or null for non-user targets.
 */
export const AdminUserTable = (props: AdminUserTableProps) => {
  const {
    target,
    users,
    selectedUserIds,
    usersPage,
    usersCount,
    usersPageSize,
    search,
    roleFilter,
    userIdsInput,
    hasUsersNextPage,
    hasUsersPreviousPage,
    isUsersLoading,
    usersError,
    isSubmitting,
    isAllVisibleSelected,
    onSearchChange,
    onRoleFilterChange,
    onUsersPageChange,
    onToggleSelectAll,
    onToggleUserSelection,
    onUserIdsInputChange,
  } = props;

  if (target !== "users") {
    return null;
  }

  return (
  <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Select recipients</h2>
        <p className="text-xs text-gray-500">Search users and pick one or more recipients below.</p>
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
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Search by username or email"
          disabled={isSubmitting}
        />
      </div>
      <select
        value={roleFilter}
        onChange={(event) => onRoleFilterChange(event.target.value as AdminUserRole)}
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
                  onChange={(event) => onToggleSelectAll(event.target.checked)}
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
                        onChange={(event) => onToggleUserSelection(user.id, event.target.checked)}
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
        Page {usersPage} of {Math.max(1, Math.ceil(usersCount / usersPageSize))}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onUsersPageChange(Math.max(1, usersPage - 1))}
          disabled={!hasUsersPreviousPage || isUsersLoading || isSubmitting}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onUsersPageChange(usersPage + 1)}
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
        onChange={(event) => onUserIdsInputChange(event.target.value)}
        className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-xs shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
        placeholder="12, 48, 150"
        disabled={isSubmitting}
      />
      <p className="mt-2 text-xs text-gray-500">
        The table selection takes priority if any users are checked.
      </p>
    </div>
  </div>
  );
};

