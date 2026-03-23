import { type FormEvent } from "react";
import { AdminUserTable } from "@/components/admin/AdminUserTable";
import { type AdminNotificationTarget, type AdminUserRole, type AdminUserSummary } from "@/types";
import { AdminBroadcastFormFields } from "./AdminBroadcastForm/AdminBroadcastFormFields";
import { AdminBroadcastFormTarget } from "./AdminBroadcastForm/AdminBroadcastFormTarget";
import { AdminBroadcastFormConfirmation } from "./AdminBroadcastForm/AdminBroadcastFormConfirmation";
import { AdminBroadcastFormActions } from "./AdminBroadcastForm/AdminBroadcastFormActions";

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
