import { describe, expect, it } from "vitest";
import { buildTaskSubmission } from "@/hooks/taskForm/buildTaskSubmission";

describe("buildTaskSubmission", () => {
  it("builds a submission for a new task", () => {
    const startDateTime = new Date("2026-03-28T09:00:00.000Z");
    const endDateTime = new Date("2026-03-28T10:00:00.000Z");

    const result = buildTaskSubmission({
      title: "Write tests",
      description: "Add task form tests",
      startDateTime,
      endDateTime,
      selectedCategories: [3, 1],
      importance: 8,
      estimatedMinutes: 45,
      colour: "#123456",
      autoSchedule: true,
      allowSplit: true,
      completed_minutes: 15,
      min_split_minutes: 20,
      max_split_minutes: 60,
      buffer_before_minutes: 5,
      buffer_after_minutes: 10,
    });

    expect(result).toEqual({
      title: "Write tests",
      description: "Add task form tests",
      start_time: startDateTime.toISOString(),
      deadline: endDateTime.toISOString(),
      categories: [3, 1],
      importance: 8,
      estimated_minutes: 45,
      colour: "#123456",
      locked: false,
      allow_split: true,
      completed: false,
      completed_minutes: 15,
      min_split_minutes: 20,
      max_split_minutes: 60,
      buffer_before_minutes: 5,
      buffer_after_minutes: 10,
    });
  });

  it("uses defaults from empty estimated minutes and keeps completed false for existing incomplete task", () => {
    const result = buildTaskSubmission({
      title: "Task",
      description: "",
      startDateTime: new Date("2026-03-28T09:00:00.000Z"),
      endDateTime: new Date("2026-03-28T10:00:00.000Z"),
      selectedCategories: [],
      importance: 5,
      estimatedMinutes: "",
      colour: "#abcdef",
      autoSchedule: false,
      allowSplit: false,
      initialData: { completed: false } as never,
      completed_minutes: 0,
      min_split_minutes: 30,
      max_split_minutes: null,
      buffer_before_minutes: 0,
      buffer_after_minutes: 0,
    });

    expect(result.locked).toBe(true);
    expect(result.estimated_minutes).toBe(0);
    expect(result.completed).toBe(false);
    expect(result.max_split_minutes).toBeNull();
  });

  it("preserves existing completed state from initialData", () => {
    const result = buildTaskSubmission({
      title: "Finished task",
      description: "done",
      startDateTime: new Date("2026-03-28T09:00:00.000Z"),
      endDateTime: new Date("2026-03-28T10:00:00.000Z"),
      selectedCategories: [2],
      importance: 7,
      estimatedMinutes: 60,
      colour: "#111111",
      autoSchedule: true,
      allowSplit: false,
      initialData: { completed: true } as never,
      completed_minutes: 60,
      min_split_minutes: 30,
      max_split_minutes: null,
      buffer_before_minutes: 0,
      buffer_after_minutes: 0,
    });

    expect(result.completed).toBe(true);
  });
});