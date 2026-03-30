import { describe, expectTypeOf, it } from "vitest";
import type { EventMutationContext, RecurrenceScope } from "@/types/recurrence";

describe("recurrence types", () => {
  it("restricts recurrence scope values", () => {
    const scope = "following" satisfies RecurrenceScope;

    expectTypeOf(scope).toMatchTypeOf<RecurrenceScope>();
  });

  it("defines the event mutation context shape", () => {
    const context = {
      scope: "all",
      original_start_time: "2026-03-30T09:00:00Z",
    } satisfies EventMutationContext;

    expectTypeOf(context).toMatchTypeOf<EventMutationContext>();
  });
});
