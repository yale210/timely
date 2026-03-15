import { describe, expect, it } from "vitest";
import { formatDjangoFormError } from "@/utils/apiErrors";

describe("formatDjangoFormError", () => {
  it("returns detail messages directly when the API includes a detail string", () => {
    const result = formatDjangoFormError({
      response: {
        status: 400,
        data: {
          detail: "Bad request.",
        },
      },
    });

    expect(result).toEqual({
      message: "Bad request.",
      fieldErrors: {},
    });
  });

  it("returns the unauthenticated message for 401 responses", () => {
    const result = formatDjangoFormError({
      response: {
        status: 401,
        data: {},
      },
    });

    expect(result).toEqual({
      message: "You are not signed in. Please log in again.",
      fieldErrors: {},
    });
  });

  it("falls back when the error does not contain a usable response body", () => {
    expect(formatDjangoFormError(new Error("boom"))).toEqual({
      message: "Something went wrong",
      fieldErrors: {},
    });
  });

  it("prefers non-field errors as the summary message", () => {
    const result = formatDjangoFormError({
      response: {
        status: 400,
        data: {
          non_field_errors: ["Unable to save form."],
          username: ["This username is taken."],
        },
      },
    });

    expect(result.message).toBe("Unable to save form.");
    expect(result.fieldErrors).toEqual({
      non_field_errors: ["Unable to save form."],
      username: ["This username is taken."],
    });
  });

  it("uses the first field message when non-field errors are absent", () => {
    const result = formatDjangoFormError({
      response: {
        status: 400,
        data: {
          username: ["This field is required."],
          email: ["Enter a valid email address."],
        },
      },
    });

    expect(result.message).toBe("This field is required.");
    expect(result.fieldErrors).toEqual({
      username: ["This field is required."],
      email: ["Enter a valid email address."],
    });
  });

  it("filters out non-string field error values", () => {
    const result = formatDjangoFormError({
      response: {
        status: 400,
        data: {
          username: ["Bad username", 123, false],
        },
      },
    });

    expect(result).toEqual({
      message: "Bad username",
      fieldErrors: {
        username: ["Bad username"],
      },
    });
  });

  it("uses a generic field-fix message when no string field errors are available", () => {
    const result = formatDjangoFormError({
      response: {
        status: 400,
        data: {
          username: [123],
        },
      },
    });

    expect(result).toEqual({
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        username: [],
      },
    });
  });
});
