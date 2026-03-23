interface ApiErrorResponse {
  status?: number;
  data?: unknown;
}

interface ApiError {
  response?: ApiErrorResponse;
}

const isApiError = (error: unknown): error is ApiError =>
  typeof error === "object" && error !== null && "response" in error;

/**
 * Parses a Django REST Framework error response into a user-friendly message and field-level errors.
 * @param error - The caught error, typically from an Axios request.
 * @returns An object containing a summary message and per-field error arrays.
 */
export const formatDjangoFormError = (
  error: unknown,
): { message: string; fieldErrors: Record<string, string[]> } => {
  const fallback = {
    message: "Something went wrong",
    fieldErrors: {} as Record<string, string[]>,
  };
  const response = isApiError(error) ? error.response : undefined;

  const status: number | undefined = response?.status;
  const data: unknown = response?.data;
  const dataRecord =
    data && typeof data === "object"
      ? (data as Record<string, unknown>)
      : null;

  const detail = dataRecord?.detail;
  if (typeof detail === "string") {
    return {
      message: detail,
      fieldErrors: {},
    };
  }

  if (status === 401) {
    return {
      message: "You are not signed in. Please log in again.",
      fieldErrors: {},
    };
  }

  if (!dataRecord) {
    return fallback;
  }

  const field: Record<string, string[]> & { non_field_errors?: string[] } = {};
  for (const [key, potentialArray] of Object.entries(dataRecord)) {
    if (Array.isArray(potentialArray)) {
      field[key] = potentialArray.filter((x): x is string => typeof x === "string");
    }
  }

  const nonField = field.non_field_errors?.join(" ").trim();
  const firstFieldMessage = Object.entries(field)
    .filter(([key]) => key !== "non_field_errors")
    .flatMap(([, msgs]) => msgs)
    .find(Boolean) ?? "";
  const message = nonField?.length
    ? nonField
    : firstFieldMessage?.length
      ? firstFieldMessage
      : "Please fix the highlighted fields.";
  return {
    message,
    fieldErrors: field,
  };
};

/**
 * Returns true when a task save failed because the requested buffer conflicts
 * with the task's current scheduled slot and should be rescheduled instead.
 * @param error - The caught API error.
 * @returns Whether the error is the task-buffer reschedule conflict case.
 */
export const hasTaskBufferRescheduleConflict = (error: unknown): boolean => {
  const { fieldErrors } = formatDjangoFormError(error);
  const messages = [
    ...(fieldErrors.buffer_before_minutes ?? []),
    ...(fieldErrors.buffer_after_minutes ?? []),
  ];
  return messages.some((message) =>
    message.includes("Reschedule or unschedule the task first."),
  );
};
