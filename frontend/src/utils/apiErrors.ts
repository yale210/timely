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
 *
 */
export const /**
              *
              * @param error
              */
formatDjangoFormError = (
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
