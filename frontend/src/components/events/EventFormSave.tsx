interface EventFormSaveProps {
    onCancel: () => void;
    hasErrors: boolean;
    hasChanges: boolean;
};

const getSaveClassName = (hasErrors: boolean, hasChanges: boolean) => {
    const base = "flex-1 px-4 py-2 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center gap-2";
    const disabled = "bg-gray-400 cursor-not-allowed";
    const enabled = "bg-orange-500 hover:bg-orange-600 hover:shadow-lg";
    return `${base} ${hasErrors || !hasChanges ? disabled : enabled}`;
};

const EventFormSave = ({
    onCancel,
    hasErrors,
    hasChanges,
}: EventFormSaveProps) => (
    <div className="p-6 border-t border-gray-200 flex gap-3 bg-gray-50">
        <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-4 py-2 bg-white border border-gray-300 text-black font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
        >
        Cancel
        </button>
        <button
        type="submit"
        disabled={hasErrors || !hasChanges}
        className={getSaveClassName(hasErrors, hasChanges)}
        >
        <span className="material-icons text-sm">check</span>
        Save Event
        </button>
    </div>
);

export default EventFormSave;