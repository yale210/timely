/**
 * Available assessment modal scheduling modes.
 */
export type AssessmentMode = "DEADLINE" | "EVENT";

/**
 * Flattens nested API error payloads into a readable list of messages.
 * @param value - Unknown backend error payload.
 * @returns A flat list of user-facing error messages.
 */
const flattenErrorMessages = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(flattenErrorMessages);
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nestedValue]) => (
      flattenErrorMessages(nestedValue).map((message) => `${key}: ${message}`)
    ));
  }
  return [];
};

/**
 * Extracts a user-facing submission error message from an unknown failure.
 * @param error - Unknown submission error.
 * @returns A readable error message.
 */
export const getSubmissionErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== "object" || !("response" in error)) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return "Failed to save assessment.";
  }

  const response = error.response;
  if (!response || typeof response !== "object" || !("data" in response)) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return "Failed to save assessment.";
  }

  const messages = flattenErrorMessages(response.data);
  if (messages.length > 0) {
    return messages.join(" ");
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Failed to save assessment.";
};
