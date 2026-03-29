import { getTaskServerFieldLabel } from "@/components/tasks/taskFormUtils";

interface TaskFormSubmitErrorProps {
  submitError: string | null;
  serverFieldErrors: Record<string, string[]>;
}

/**
 * Displays task-form submission errors and any field-specific backend messages.
 * @param props Task form error content.
 * @param props.submitError User-facing submit error message.
 * @param props.serverFieldErrors Backend field errors keyed by field name.
 * @returns The rendered error banner, or nothing when there is no submit error.
 */
export default function TaskFormSubmitError({
  submitError,
  serverFieldErrors,
}: TaskFormSubmitErrorProps) {
  if (!submitError) return null;

  const fieldErrorEntries = Object.entries(serverFieldErrors)
    .filter(([, messages]) => messages.length > 0);

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <p>{submitError}</p>
      {fieldErrorEntries.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
          {fieldErrorEntries.map(([field, messages]) => (
            <li key={field}>
              <span className="font-medium">{getTaskServerFieldLabel(field)}:</span>{" "}
              {messages.join(" ")}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
