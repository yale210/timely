import { describe, expect, it } from "vitest";
import {
  buildTaskFormErrors,
  hasTaskBlockingErrors,
  isTaskBufferMinutesInvalid,
  isTaskCompletedMinutesInvalid,
  isTaskImportanceInvalid,
  isTaskMaxSplitMinutesInvalid,
  isTaskMinSplitMinutesInvalid,
  isTaskTimeInvalid,
} from "@/hooks/taskForm/taskFormValidation";

describe("taskFormValidation", () => {
  const validStart = new Date("2026-03-28T09:00:00.000Z");
  const validEnd = new Date("2026-03-28T10:00:00.000Z");

  it("detects invalid time ranges", () => {
    expect(isTaskTimeInvalid(validStart, validEnd)).toBe(false);
    expect(isTaskTimeInvalid(validEnd, validStart)).toBe(true);
    expect(isTaskTimeInvalid(new Date("invalid"), validEnd)).toBe(true);
  });

  it("detects invalid importance", () => {
    expect(isTaskImportanceInvalid(1)).toBe(false);
    expect(isTaskImportanceInvalid(10)).toBe(false);
    expect(isTaskImportanceInvalid(0)).toBe(true);
    expect(isTaskImportanceInvalid(11)).toBe(true);
    expect(isTaskImportanceInvalid(Number.NaN)).toBe(true);
  });

  it("detects invalid completed minutes", () => {
    expect(isTaskCompletedMinutesInvalid(60, 30)).toBe(false);
    expect(isTaskCompletedMinutesInvalid(60, "")).toBe(true);
    expect(isTaskCompletedMinutesInvalid(60, 61)).toBe(true);
    expect(isTaskCompletedMinutesInvalid(60, -1)).toBe(true);
  });

  it("detects invalid minimum split minutes", () => {
    expect(isTaskMinSplitMinutesInvalid(false, "")).toBe(false);
    expect(isTaskMinSplitMinutesInvalid(true, "")).toBe(true);
    expect(isTaskMinSplitMinutesInvalid(true, "10")).toBe(true);
    expect(isTaskMinSplitMinutesInvalid(true, "30")).toBe(false);
  });

  it("detects invalid maximum split minutes", () => {
    expect(isTaskMaxSplitMinutesInvalid(false, "30", "")).toBe(false);
    expect(isTaskMaxSplitMinutesInvalid(true, "30", "")).toBe(false);
    expect(isTaskMaxSplitMinutesInvalid(true, "30", "20")).toBe(true);
    expect(isTaskMaxSplitMinutesInvalid(true, "30", "1500")).toBe(true);
    expect(isTaskMaxSplitMinutesInvalid(true, "30", "60")).toBe(false);
  });

  it("detects invalid buffer minutes", () => {
    expect(isTaskBufferMinutesInvalid(false, "")).toBe(false);
    expect(isTaskBufferMinutesInvalid(true, "")).toBe(true);
    expect(isTaskBufferMinutesInvalid(true, "-1")).toBe(true);
    expect(isTaskBufferMinutesInvalid(true, "241")).toBe(true);
    expect(isTaskBufferMinutesInvalid(true, "15")).toBe(false);
  });

  it("builds the expected error object", () => {
    const result = buildTaskFormErrors(
      validEnd,
      validStart,
      0,
      true,
      60,
      "",
      true,
      "10",
      "5",
      true,
      "",
      "999",
      true,
    );

    expect(result).toEqual({
      start: true,
      deadline: true,
      importance: true,
      completed_minutes: true,
      min_split_minutes: true,
      max_split_minutes: true,
      buffer_before_minutes: true,
      buffer_after_minutes: true,
    });
  });

  it("does not add submit-gated errors before submit", () => {
    const result = buildTaskFormErrors(
      validStart,
      validEnd,
      5,
      false,
      60,
      "",
      true,
      "",
      "10",
      true,
      "",
      "",
      false,
    );

    expect(result).toEqual({});
  });

  it("reports blocking errors when any validation fails", () => {
    expect(
      hasTaskBlockingErrors(
        validStart,
        validEnd,
        5,
        60,
        30,
        false,
        "30",
        "",
        false,
        "0",
        "0",
      ),
    ).toBe(false);

    expect(
      hasTaskBlockingErrors(
        validEnd,
        validStart,
        5,
        60,
        30,
        false,
        "30",
        "",
        false,
        "0",
        "0",
      ),
    ).toBe(true);
  });
});