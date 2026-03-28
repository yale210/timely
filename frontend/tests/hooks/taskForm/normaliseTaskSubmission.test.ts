import { describe, expect, it } from "vitest";
import {
  isTaskSubmissionEqual,
  normaliseTaskSubmission,
} from "@/hooks/taskForm/normaliseTaskSubmission";

describe("normaliseTaskSubmission", () => {
  it("fills defaults and sorts category ids", () => {
    const result = normaliseTaskSubmission({
      title: undefined,
      description: undefined,
      start_time: undefined,
      deadline: undefined,
      colour: undefined,
      categories: [5, 2, 4],
      importance: undefined,
      estimated_minutes: undefined,
      completed_minutes: undefined,
      completed: undefined,
      locked: undefined,
      allow_split: undefined,
      min_split_minutes: undefined,
      max_split_minutes: undefined,
      buffer_before_minutes: undefined,
      buffer_after_minutes: undefined,
    });

    expect(result).toEqual({
      title: "",
      description: "",
      start_time: "",
      deadline: "",
      colour: "",
      categories: [2, 4, 5],
      importance: 5,
      estimated_minutes: 60,
      completed_minutes: 0,
      completed: false,
      locked: false,
      allow_split: false,
      min_split_minutes: 30,
      max_split_minutes: null,
      buffer_before_minutes: 0,
      buffer_after_minutes: 0,
    });
  });

  it("compares equal submissions correctly", () => {
    const left = normaliseTaskSubmission({
      title: "A",
      description: "B",
      start_time: "2026-03-28T09:00:00.000Z",
      deadline: "2026-03-28T10:00:00.000Z",
      colour: "#000000",
      categories: [2, 1],
      importance: 3,
      estimated_minutes: 40,
      completed_minutes: 10,
      completed: false,
      locked: true,
      allow_split: true,
      min_split_minutes: 25,
      max_split_minutes: 50,
      buffer_before_minutes: 5,
      buffer_after_minutes: 10,
    });

    const right = normaliseTaskSubmission({
      title: "A",
      description: "B",
      start_time: "2026-03-28T09:00:00.000Z",
      deadline: "2026-03-28T10:00:00.000Z",
      colour: "#000000",
      categories: [1, 2],
      importance: 3,
      estimated_minutes: 40,
      completed_minutes: 10,
      completed: false,
      locked: true,
      allow_split: true,
      min_split_minutes: 25,
      max_split_minutes: 50,
      buffer_before_minutes: 5,
      buffer_after_minutes: 10,
    });

    expect(isTaskSubmissionEqual(left, right)).toBe(true);
  });

  it("detects different submissions", () => {
    const left = normaliseTaskSubmission({
      title: "A",
      categories: [1],
    });

    const right = normaliseTaskSubmission({
      title: "B",
      categories: [1],
    });

    expect(isTaskSubmissionEqual(left, right)).toBe(false);
  });
});