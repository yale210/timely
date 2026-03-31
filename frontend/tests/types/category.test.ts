import { describe, expectTypeOf, it } from "vitest";
import type { Category } from "@/types/category";

describe("category types", () => {
  it("defines the category shape", () => {
    const category = {
      id: 1,
      text: "Study",
      colour: "#3b82f6",
      colour_override: true,
      max_daily_study_time: 120,
    } satisfies Category;

    expectTypeOf(category).toMatchTypeOf<Category>();
  });
});
