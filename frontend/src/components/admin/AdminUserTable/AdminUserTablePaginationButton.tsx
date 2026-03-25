interface AdminUserTablePaginationButtonProps {
  /**
   * The text label for the button.
   */
  label: string;
  /**
   * Callback when the button is clicked.
   */
  onClick: () => void;
  /**
   * Whether the button is disabled.
   */
  disabled: boolean;
}

/**
 * Renders a styled button for AdminUserTable pagination.
 * @param props - Button label and event handlers.
 * @returns A pagination button component.
 */
export const AdminUserTablePaginationButton = (
  props: AdminUserTablePaginationButtonProps
) => {
  const { label, onClick, disabled } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
};
