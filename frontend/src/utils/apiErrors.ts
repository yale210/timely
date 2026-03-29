interface ApiErrorResponse {
  status?: number;
  data?: unknown;
}

interface ApiError {
  response?: ApiErrorResponse;
}

type FieldErrors = Record<string, string[]> & { non_field_errors?: string[] };
interface FormErrorResult {
  message: string;
  fieldErrors: Record<string, string[]>;
}

const isApiError = (error: unknown): error is ApiError =>
  typeof error === "object" && error !== null && "response" in error;

const getFallbackError = (): FormErrorResult => ({
  message: "Something went wrong",
  fieldErrors: {},
});

const getResponseDataRecord = (
  error: unknown,
): { status?: number; dataRecord: Record<string, unknown> | null } => {
  const response = isApiError(error) ? error.response : undefined;
  const data = response?.data;
  return {
    status: response?.status,
    dataRecord:
      data && typeof data === "object"
        ? (data as Record<string, unknown>)
        : null,
  };
};

const getTopLevelError = (
  status: number | undefined,
  dataRecord: Record<string, unknown> | null,
): FormErrorResult | null => {
  // Prefer DRF's top-level `detail` message over field parsing when present.
  const detail = dataRecord?.detail;
  if (typeof detail === "string") {
    return { message: detail, fieldErrors: {} };
  }

  if (status === 401) {
    return {
      message: "You are not signed in. Please log in again.",
      fieldErrors: {},
    };
  }

  if (typeof status === "number" && status >= 500) {
    return {
      message: "The server is unavailable right now. Please try again in a moment.",
      fieldErrors: {},
    };
  }

  return null;
};

const getFieldErrors = (dataRecord: Record<string, unknown>): FieldErrors => {
  const fieldErrors: FieldErrors = {};
  for (const [key, potentialArray] of Object.entries(dataRecord)) {
    if (typeof potentialArray === "string") {
      fieldErrors[key] = [potentialArray];
      continue;
    }

    if (Array.isArray(potentialArray)) {
      fieldErrors[key] = potentialArray.filter(
        (value): value is string => typeof value === "string",
      );
    }
  }
  return fieldErrors;
};

const getFieldErrorMessage = (fieldErrors: FieldErrors): string => {
  // Non-field errors already describe whole-form failures, so surface them first.
  const nonFieldMessage = fieldErrors.non_field_errors?.join(" ").trim();
  if (nonFieldMessage) {
    return nonFieldMessage;
  }

  const firstFieldMessage = Object.entries(fieldErrors)
    .filter(([key]) => key !== "non_field_errors")
    .flatMap(([, messages]) => messages)
    .find(Boolean);

  return firstFieldMessage ?? "Please fix the highlighted fields.";
};

/**
 * Parses a Django REST Framework error response into a user-friendly message and field-level errors.
 * @param error - The caught error, typically from an Axios request.
 * @returns An object containing a summary message and per-field error arrays.
 */
export const formatDjangoFormError = (
  error: unknown,
): FormErrorResult => {
  const { status, dataRecord } = getResponseDataRecord(error);
  const topLevelError = getTopLevelError(status, dataRecord);
  if (topLevelError) {
    return topLevelError;
  }

  if (!dataRecord) {
    if (isApiError(error) && error.response === undefined) {
      return {
        message: "Unable to reach the server. Please check your connection and try again.",
        fieldErrors: {},
      };
    }

    return getFallbackError();
  }

  const fieldErrors = getFieldErrors(dataRecord);
  return {
    message: getFieldErrorMessage(fieldErrors),
    fieldErrors,
  };
};

/**
 * Returns true when a task save failed because the requested buffer conflicts
 * with the task's current scheduled slot and should be rescheduled instead.
 * @param error - The caught API error.
 * @returns Whether the error is the task-buffer reschedule conflict case.
 */
export const hasTaskAllocationRescheduleConflict = (error: unknown): boolean => {
  const { fieldErrors } = formatDjangoFormError(error);
  const messages = [
    ...(fieldErrors.allocation ?? []),
    ...(fieldErrors.buffer_before_minutes ?? []),
    ...(fieldErrors.buffer_after_minutes ?? []),
  ];
  return messages.some((message) =>
    message.includes("Reschedule or unschedule the task first.")
    || message.includes("Allocation slots cannot"),
  );
};

export const hasTaskBufferRescheduleConflict = hasTaskAllocationRescheduleConflict;
