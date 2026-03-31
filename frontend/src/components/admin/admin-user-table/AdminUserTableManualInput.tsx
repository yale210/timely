interface AdminUserTableManualInputProps {
  /**
   * Current manual user ID input string.
   */
  userIdsInput: string;
  /**
   * Whether the form is currently submitting, disabling interactions.
   */
  isSubmitting: boolean;
  /**
   * Callback to update the manual user ID input.
   * @param value - The new input string.
   */
  onUserIdsInputChange: (value: string) => void;
}

/**
 * Renders manual user ID input for the AdminUserTable.
 * @param props - Input state and change callbacks.
 * @returns Manual input UI.
 */
export const AdminUserTableManualInput = (props: AdminUserTableManualInputProps) => {
  const { userIdsInput, isSubmitting, onUserIdsInputChange } = props;

  return (
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
  );
};
