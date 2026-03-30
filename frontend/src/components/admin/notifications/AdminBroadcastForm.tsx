import { type FormEvent } from "react";
import { AdminUserTable } from "@/components/admin/AdminUserTable";
import { type AdminNotificationTarget, type AdminUserRole, type AdminUserSummary } from "@/types";

interface AdminBroadcastFormTitleFieldProps {
  title: string;
  titleLimit: number;
  isSubmitting: boolean;
  onTitleChange: (value: string) => void;
}

/**
 * Renders the title field for the broadcast form.
 * @param props - Title state and change callbacks.
 * @returns Title input component.
 */
export function AdminBroadcastFormTitleField(props: AdminBroadcastFormTitleFieldProps) {
  const isTooLong = props.title.trim().length > props.titleLimit;

  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <span className={`text-xs ${isTooLong ? "text-red-600" : "text-gray-400"}`}>
          {props.title.trim().length}/{props.titleLimit}
        </span>
      </div>
      <input
        id="title"
        type="text"
        value={props.title}
        onChange={(event) => props.onTitleChange(event.target.value)}
        className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
        placeholder="Semester update"
        maxLength={props.titleLimit}
        required
        disabled={props.isSubmitting}
      />
    </div>
  );
}

interface AdminBroadcastFormMessageFieldProps {
  message: string;
  messageLimit: number;
  isSubmitting: boolean;
  onMessageChange: (value: string) => void;
}

/**
 * Renders the message field for the broadcast form.
 * @param props - Message state and change callbacks.
 * @returns Message textarea component.
 */
export function AdminBroadcastFormMessageField(props: AdminBroadcastFormMessageFieldProps) {
  const isTooLong = props.message.trim().length > props.messageLimit;

  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message
        </label>
        <span className={`text-xs ${isTooLong ? "text-red-600" : "text-gray-400"}`}>
          {props.message.trim().length}/{props.messageLimit}
        </span>
      </div>
      <textarea
        id="message"
        value={props.message}
        onChange={(event) => props.onMessageChange(event.target.value)}
        rows={6}
        className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
        placeholder="Share the latest update with the community."
        maxLength={props.messageLimit}
        required
        disabled={props.isSubmitting}
      />
    </div>
  );
}

interface AdminBroadcastFormFieldsProps {
  title: string;
  message: string;
  titleLimit: number;
  messageLimit: number;
  isSubmitting: boolean;
  onTitleChange: (value: string) => void;
  onMessageChange: (value: string) => void;
}

/**
 * Renders title and message fields for the broadcast form.
 * @param props - Field state and change callbacks.
 * @returns Form input components for title and message.
 */
export function AdminBroadcastFormFields(props: AdminBroadcastFormFieldsProps) {
  return (
    <>
      <AdminBroadcastFormTitleField
        title={props.title}
        titleLimit={props.titleLimit}
        isSubmitting={props.isSubmitting}
        onTitleChange={props.onTitleChange}
      />
      <AdminBroadcastFormMessageField
        message={props.message}
        messageLimit={props.messageLimit}
        isSubmitting={props.isSubmitting}
        onMessageChange={props.onMessageChange}
      />
    </>
  );
}

interface AdminBroadcastFormTargetProps {
  target: AdminNotificationTarget;
  targetAudienceCount: number;
  audienceCounts: {
    all: number;
    staff: number;
    admin: number;
    selected_users: number;
  };
  targetOptions: { label: string; value: AdminNotificationTarget }[];
  isSubmitting: boolean;
  onTargetChange: (value: AdminNotificationTarget) => void;
}

/**
 * Renders the target audience selection field for the broadcast form.
 * @param props - Target state and change callbacks.
 * @returns A target selection component.
 */
export function AdminBroadcastFormTarget(props: AdminBroadcastFormTargetProps) {
  return (
    <div>
      <label htmlFor="target" className="block text-sm font-medium text-gray-700">
        Target audience
      </label>
      <select
        id="target"
        value={props.target}
        onChange={(event) => props.onTargetChange(event.target.value as AdminNotificationTarget)}
        className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
        disabled={props.isSubmitting}
      >
        {props.targetOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.value === "all" ? ` (${props.audienceCounts.all})` : ""}
            {option.value === "staff" ? ` (${props.audienceCounts.staff})` : ""}
            {option.value === "admin" ? ` (${props.audienceCounts.admin})` : ""}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-gray-500">Estimated recipients: {props.targetAudienceCount}</p>
    </div>
  );
}

interface AdminBroadcastFormConfirmationProps {
  /**
   * Whether the confirmation checkbox is checked.
   */
  confirmationChecked: boolean;
  /**
   * Whether the form is currently submitting, disabling interactions.
   */
  isSubmitting: boolean;
  /**
   * General error message to display, if any.
   */
  error: string | null;
  /**
   * Callback to update the confirmation state.
   * @param checked - Whether the checkbox is checked.
   */
  onConfirmationChange: (checked: boolean) => void;
}

/**
 * Renders the confirmation section and error messages for the broadcast form.
 * @param props - Confirmation state and callbacks.
 * @returns Confirmation UI component.
 */
export function AdminBroadcastFormConfirmation(props: AdminBroadcastFormConfirmationProps) {
  const { confirmationChecked, isSubmitting, error, onConfirmationChange } = props;

  return (
    <>
      <div className="rounded-md border border-indigo-200 bg-indigo-50/50 px-4 py-3">
        <label className="flex items-start gap-2 text-sm text-indigo-900">
          <input
            type="checkbox"
            checked={confirmationChecked}
            onChange={(event) => onConfirmationChange(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
            disabled={isSubmitting}
          />
          <span>I confirm that this broadcast is ready to send to the selected audience.</span>
        </label>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </>
  );
}

interface AdminBroadcastFormActionsProps {
  /**
   * Whether the form is currently submitting.
   */
  isSubmitting: boolean;
  /**
   * Whether the form is in a valid state to be submitted.
   */
  canSubmit: boolean;
}

/**
 * Renders the submit action button for the broadcast form.
 * @param props - Submission state flags.
 * @returns Action button component.
 */
export function AdminBroadcastFormActions(props: AdminBroadcastFormActionsProps) {
  const { isSubmitting, canSubmit } = props;

  return (
    <div className="flex items-center justify-end">
      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Sending..." : "Send notification"}
      </button>
    </div>
  );
}

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
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <form onSubmit={props.onSubmit} className="space-y-6">
        <AdminBroadcastFormFields {...props} />
        <AdminBroadcastFormTarget {...props} />
        <AdminUserTable {...props} />
        <AdminBroadcastFormConfirmation {...props} />
        <AdminBroadcastFormActions {...props} />
      </form>
    </div>
  );
};
