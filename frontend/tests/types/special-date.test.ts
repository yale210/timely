import { describe, expectTypeOf, it } from "vitest";
import type { SpecialDate } from "@/types/special-date";

describe("special-date types", () => {
  it("defines the special date shape", () => {
    const specialDate = {
      id: 1,
      date: "2026-12-25",
      text: "Christmas Day",
    } satisfies SpecialDate;

    expectTypeOf(specialDate).toMatchTypeOf<SpecialDate>();
  });
});
