interface AdminBroadcastFormTitleFieldProps {
  title: string;
  titleLimit: number;
  isSubmitting: boolean;
  onTitleChange: (value: string) => void;
}

/**
 * Renders the title field for the broadcast form.
 * @param props - Title state and change callbacks.
 * @returns Title input component.
 */
export const AdminBroadcastFormTitleField = (props: AdminBroadcastFormTitleFieldProps) => {
  const isTooLong = props.title.trim().length > props.titleLimit;
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
        <span className={`text-xs ${isTooLong ? "text-red-600" : "text-gray-400"}`}>
          {props.title.trim().length}/{props.titleLimit}
        </span>
      </div>
      <input
        id="title"
        type="text"
        value={props.title}
        onChange={(event) => props.onTitleChange(event.target.value)}
        className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
        placeholder="Semester update"
        maxLength={props.titleLimit}
        required
        disabled={props.isSubmitting}
      />
    </div>
  );
};
