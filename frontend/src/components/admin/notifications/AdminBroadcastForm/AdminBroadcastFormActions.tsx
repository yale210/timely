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
export const AdminBroadcastFormActions = (props: AdminBroadcastFormActionsProps) => {
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
};
