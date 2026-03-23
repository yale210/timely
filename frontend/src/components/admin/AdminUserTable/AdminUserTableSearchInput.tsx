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
