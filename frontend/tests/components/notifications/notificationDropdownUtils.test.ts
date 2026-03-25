import { describe, expect, it } from "vitest";
import { getPendingFriendRequests } from "@/components/notifications/notificationDropdownUtils";
import type { Friendship } from "@/types";

describe("notificationDropdownUtils", () => {
  it("returns up to three pending requests for the current user", () => {
    const friendships = [
      { id: 1, state: "SENT", receiver: 7 },
      { id: 2, state: "ACCEPTED", receiver: 7 },
      { id: 3, state: "SENT", receiver: 7 },
      { id: 4, state: "SENT", receiver: 9 },
      { id: 5, state: "SENT", receiver: 7 },
      { id: 6, state: "SENT", receiver: 7 },
    ] as Friendship[];

    expect(getPendingFriendRequests(friendships, 7).map((friendship) => friendship.id)).toEqual([1, 3, 5]);
  });
});
