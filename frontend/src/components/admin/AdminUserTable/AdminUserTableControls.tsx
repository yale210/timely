import { type AdminUserRole } from "@/types";
import { AdminUserTableSearchInput } from "./AdminUserTableSearchInput";
import { AdminUserTableRoleFilter } from "./AdminUserTableRoleFilter";

interface AdminUserTableControlsProps {
  selectedCount: number;
  search: string;
  roleFilter: AdminUserRole;
  isSubmitting: boolean;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: AdminUserRole) => void;
}

/**
 * Renders header and filter controls for the user selection table.
 * @param props - Selection state and filter callbacks.
 * @returns Filter and search UI controls.
 */
export const AdminUserTableControls = (props: AdminUserTableControlsProps) => {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Select recipients</h2>
          <p className="text-xs text-gray-500">Search users and pick recipients below.</p>
        </div>
        <div className="text-xs text-gray-500">{props.selectedCount} selected</div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <AdminUserTableSearchInput
          search={props.search}
          isSubmitting={props.isSubmitting}
          onSearchChange={props.onSearchChange}
        />
        <AdminUserTableRoleFilter
          roleFilter={props.roleFilter}
          isSubmitting={props.isSubmitting}
          onRoleFilterChange={props.onRoleFilterChange}
        />
      </div>
    </>
  );
};
