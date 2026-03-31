interface Props {
    onCancel: () => void;
    hasChanges: boolean;
    isSubmitting: boolean;
}

/**
 * Renders the save and cancel actions for the task form.
 * @param props The component props.
 * @param props.onCancel Closes the form without saving.
 * @param props.hasChanges Indicates whether the form differs from its initial state.
 * @param props.isSubmitting Indicates whether the form is currently being submitted.
 * @returns The footer action buttons for the task form.
 */
export default function TaskFormSave({
    onCancel,
    hasChanges,
    isSubmitting,
}: Props) {
    return (
        <div className="flex gap-3 border-t border-gray-200 bg-gray-50 p-4">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-black shadow-sm transition-colors hover:bg-gray-100"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={!hasChanges || isSubmitting}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium text-white shadow-md transition-all ${
                    !hasChanges || isSubmitting
                        ? "cursor-not-allowed bg-gray-400"
                        : "bg-primary hover:bg-blue-300 hover:shadow-lg"
                }`}
            >
                <span className="material-icons text-sm">check</span>
                {isSubmitting ? "Saving..." : "Save Task"}
            </button>
        </div>
    );
}