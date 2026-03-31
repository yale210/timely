import { type AdminUserRole } from "@/types";

interface AdminUserTableSearchInputProps {
  /**
   * Current search query.
   */
  search: string;
  /**
   * Whether the form is currently submitting, disabling interactions.
   */
  isSubmitting: boolean;
  /**
   * Callback to update the search query.
   * @param value - The new search string.
   */
  onSearchChange: (value: string) => void;
}

/**
 * Renders a styled search input for AdminUserTable.
 * @param props - Search state and change handlers.
 * @returns A search input component.
 */
export const AdminUserTableSearchInput = (props: AdminUserTableSearchInputProps) => {
  const { search, isSubmitting, onSearchChange } = props;

  return (
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
  );
};

interface AdminUserTableRoleFilterProps {
  /**
   * Current role filter value.
   */
  roleFilter: AdminUserRole;
  /**
   * Whether the form is currently submitting, disabling interactions.
   */
  isSubmitting: boolean;
  /**
   * Callback to update the role filter.
   * @param value - The new role filter.
   */
  onRoleFilterChange: (value: AdminUserRole) => void;
}

/**
 * Renders a role filter dropdown for AdminUserTable.
 * @param props - Filter state and change handlers.
 * @returns A role filter select component.
 */
export const AdminUserTableRoleFilter = (props: AdminUserTableRoleFilterProps) => {
  const { roleFilter, isSubmitting, onRoleFilterChange } = props;

  return (
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
  );
};

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
