import type { Friendship } from "@/types";

/**
 * Returns the latest pending friend requests for the current user.
 * @param friendships - All friendship records available to the user.
 * @param userId - The current user identifier.
 */
export const getPendingFriendRequests = (friendships: Friendship[], userId: number | undefined) => friendships
  .filter((friendship) => friendship.state === "SENT" && friendship.receiver === userId)
  .slice(0, 3);
