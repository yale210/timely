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
export const AdminBroadcastFormConfirmation = (
  props: AdminBroadcastFormConfirmationProps
) => {
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
          <span>
            I confirm that this broadcast is ready to send to the selected audience.
          </span>
        </label>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </>
  );
};
