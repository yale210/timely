import { type FormEvent } from "react";
import { AdminUserTable } from "@/components/admin/AdminUserTable";
import { type AdminNotificationTarget, type AdminUserRole, type AdminUserSummary } from "@/types";

interface AdminBroadcastFormProps {
  title: string;
  message: string;
  target: AdminNotificationTarget;
  userIdsInput: string;
  confirmationChecked: boolean;
  audienceCounts: {
    all: number;
    staff: number;
    admin: number;
    selected_users: number;
  };
  targetAudienceCount: number;
  users: AdminUserSummary[];
  selectedUserIds: number[];
  usersPage: number;
  usersCount: number;
  usersPageSize: number;
  search: string;
  roleFilter: AdminUserRole;
  hasUsersNextPage: boolean;
  hasUsersPreviousPage: boolean;
  isAllVisibleSelected: boolean;
  isSubmitting: boolean;
  isUsersLoading: boolean;
  usersError: string | null;
  titleLimit: number;
  messageLimit: number;
  canSubmit: boolean;
  error: string | null;
  targetOptions: { label: string; value: AdminNotificationTarget }[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onTargetChange: (value: AdminNotificationTarget) => void;
  onConfirmationChange: (checked: boolean) => void;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: AdminUserRole) => void;
  onUsersPageChange: (page: number) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleUserSelection: (userId: number, checked: boolean) => void;
  onUserIdsInputChange: (value: string) => void;
}

/**
 * Renders the admin broadcast form and recipient selection controls.
 * @param props - Form state, derived metadata, and all event handlers.
 * @returns The admin broadcast form layout.
 */
export const AdminBroadcastForm = (props: AdminBroadcastFormProps) => {
  const {
    title,
    message,
    target,
    userIdsInput,
    confirmationChecked,
    audienceCounts,
    targetAudienceCount,
    users,
    selectedUserIds,
    usersPage,
    usersCount,
    usersPageSize,
    search,
    roleFilter,
    hasUsersNextPage,
    hasUsersPreviousPage,
    isAllVisibleSelected,
    isSubmitting,
    isUsersLoading,
    usersError,
    titleLimit,
    messageLimit,
    canSubmit,
    error,
    targetOptions,
    onSubmit,
    onTitleChange,
    onMessageChange,
    onTargetChange,
    onConfirmationChange,
    onSearchChange,
    onRoleFilterChange,
    onUsersPageChange,
    onToggleSelectAll,
    onToggleUserSelection,
    onUserIdsInputChange,
  } = props;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <span
              className={`text-xs ${title.trim().length > titleLimit ? "text-red-600" : "text-gray-400"}`}
            >
              {title.trim().length}/{titleLimit}
            </span>
          </div>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Semester update"
            maxLength={titleLimit}
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
                message.trim().length > messageLimit ? "text-red-600" : "text-gray-400"
              }`}
            >
              {message.trim().length}/{messageLimit}
            </span>
          </div>
          <textarea
            id="message"
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            rows={6}
            className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Share the latest update with the community."
            maxLength={messageLimit}
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
            onChange={(event) => onTargetChange(event.target.value as AdminNotificationTarget)}
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

        <AdminUserTable
          target={target}
          users={users}
          selectedUserIds={selectedUserIds}
          usersPage={usersPage}
          usersCount={usersCount}
          usersPageSize={usersPageSize}
          search={search}
          roleFilter={roleFilter}
          userIdsInput={userIdsInput}
          hasUsersNextPage={hasUsersNextPage}
          hasUsersPreviousPage={hasUsersPreviousPage}
          isUsersLoading={isUsersLoading}
          usersError={usersError}
          isSubmitting={isSubmitting}
          isAllVisibleSelected={isAllVisibleSelected}
          onSearchChange={onSearchChange}
          onRoleFilterChange={onRoleFilterChange}
          onUsersPageChange={onUsersPageChange}
          onToggleSelectAll={onToggleSelectAll}
          onToggleUserSelection={onToggleUserSelection}
          onUserIdsInputChange={onUserIdsInputChange}
        />

        <div className="rounded-md border border-indigo-200 bg-indigo-50/50 px-4 py-3">
          <label className="flex items-start gap-2 text-sm text-indigo-900">
            <input
              type="checkbox"
              checked={confirmationChecked}
              onChange={(event) => onConfirmationChange(event.target.checked)}
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
  );
};

