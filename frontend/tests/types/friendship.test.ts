import { describe, expectTypeOf, it } from "vitest";
import type { Friendship } from "@/types/friendship";

describe("friendship types", () => {
  it("defines the friendship shape", () => {
    const friendship = {
      id: 1,
      sender: 10,
      receiver: 11,
      sender_username: "alice",
      receiver_username_display: "bob",
      sender_name: "Alice",
      receiver_name: "Bob",
      sender_avatar: null,
      receiver_avatar: null,
      state: "SENT",
      updated_at: "2026-03-30T09:00:00Z",
    } satisfies Friendship;

    expectTypeOf(friendship).toMatchTypeOf<Friendship>();
  });
});
