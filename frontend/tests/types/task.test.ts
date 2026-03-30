import { describe, expectTypeOf, it } from "vitest";
import type { Category } from "@/types/category";
import type { Task, TaskFormErrors, TaskSubmission, TaskUpdatedResponse } from "@/types/task";

describe("task types", () => {
  it("defines the full task shape", () => {
    const category = { id: 1, text: "Study" } satisfies Category;
    const task = {
      id: 1,
      title: "Revise notes",
      description: "Go over lecture material",
      start_time: "2026-03-30T09:00:00Z",
      deadline: "2026-03-31T18:00:00Z",
      colour: "#3b82f6",
      importance: 8,
      completed: false,
      completed_minutes: 10,
      remaining_minutes: 50,
      locked: false,
      allow_split: true,
      min_split_minutes: 15,
      max_split_minutes: 30,
      buffer_before_minutes: 5,
      buffer_after_minutes: 5,
      categories: [category],
      estimated_minutes: 60,
      parent_task: null,
      allocation: [{ start: "2026-03-30T09:00:00Z", end: "2026-03-30T10:00:00Z" }],
      total_task_allocations: 1,
    } satisfies Task;

    expectTypeOf(task).toMatchTypeOf<Task>();
  });

  it("defines the task update response shape", () => {
    const response = {
      id: 1,
      title: "Revise notes",
      start_time: "2026-03-30T09:00:00Z",
      deadline: "2026-03-31T18:00:00Z",
      importance: 8,
      completed: true,
      categories: [],
      estimated_minutes: 60,
      level_up: true,
      new_level: 4,
      xp: 240,
      reschedule_warning: "Shifted due to conflict",
    } satisfies TaskUpdatedResponse;

    expectTypeOf(response).toMatchTypeOf<TaskUpdatedResponse>();
  });

  it("defines task submission data with category ids", () => {
    const submission = {
      title: "Revise notes",
      categories: [1, 2],
      estimated_minutes: 60,
    } satisfies TaskSubmission;

    expectTypeOf(submission).toMatchTypeOf<TaskSubmission>();
  });

  it("defines task form errors as string boolean flags", () => {
    const errors = {
      start: true,
      deadline: false,
    } satisfies TaskFormErrors;

    expectTypeOf(errors).toMatchTypeOf<TaskFormErrors>();
  });
});
