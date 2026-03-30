import { describe, expectTypeOf, it } from "vitest";
import type { Share } from "@/types/share";

describe("share types", () => {
  it("defines the event share payload shape", () => {
    const share = {
      id: 1,
      sender: 2,
      receiver: 3,
      sender_username: "alice",
      receiver_username: "bob",
      event_id: 9,
      event_title: "Lab session",
    } satisfies Share;

    expectTypeOf(share).toMatchTypeOf<Share>();
  });
});
