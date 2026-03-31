import { describe, expectTypeOf, it } from "vitest";
import type { EditInitial } from "@/types/gradebook";

describe("gradebook types", () => {
  it("defines editable gradebook modal state", () => {
    const initial = {
      id: 1,
      name: "Midterm",
      score: 78,
      total: 100,
      date: "2026-03-30",
      categoryId: 3,
    } satisfies Exclude<EditInitial, null>;

    expectTypeOf(initial).toMatchTypeOf<Exclude<EditInitial, null>>();
  });

  it("allows null edit state", () => {
    const initial = null satisfies EditInitial;

    expectTypeOf(initial).toMatchTypeOf<EditInitial>();
  });
});
