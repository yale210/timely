import { useCallback, useEffect, useState } from "react";
import type { Friendship } from "@/types";
import * as friendshipService from "@/services/friendshipService";

interface UseFriendshipsState {
  friendships: Friendship[];
  loading: boolean;
  error: string | null;
  sending: boolean;
  actingIds: Set<number>;
}

export const useFriendships = () => {
  const [state, setState] = useState<UseFriendshipsState>({
    friendships: [],
    loading: false,
    error: null,
    sending: false,
    actingIds: new Set(),
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const friendships = await friendshipService.getFriendships();
      setState((prev) => ({ ...prev, friendships, loading: false, error: null }));
    } catch (err) {
      console.error("Failed to load friendships", err);
      setState((prev) => ({ ...prev, loading: false, error: "Failed to load friendships" }));
    }
  }, []);

  const sendRequest = useCallback(async (receiver: number) => {
    setState((prev) => ({ ...prev, sending: true }));
    try {
      const friendship = await friendshipService.sendFriendRequest(receiver);
      setState((prev) => {
        const exists = prev.friendships.some((item) => item.id === friendship.id);
        const friendships = exists
          ? prev.friendships.map((item) => (item.id === friendship.id ? friendship : item))
          : [friendship, ...prev.friendships];
        return { ...prev, friendships, sending: false, error: null };
      });
    } catch (err) {
      console.error("Failed to send friend request", err);
      setState((prev) => ({ ...prev, sending: false, error: "Failed to send friend request" }));
    }
  }, []);

  const actOnRequest = useCallback(async (id: number, action: "accept" | "decline") => {
    setState((prev) => {
      const nextIds = new Set(prev.actingIds);
      nextIds.add(id);
      return { ...prev, actingIds: nextIds };
    });

    try {
      if (action === "accept") {
        await friendshipService.acceptFriendRequest(id);
      } else {
        await friendshipService.declineFriendRequest(id);
      }
      await refresh();
    } catch (err) {
      console.error("Failed to update friend request", err);
      setState((prev) => ({ ...prev, error: "Failed to update friend request" }));
    } finally {
      setState((prev) => {
        const nextIds = new Set(prev.actingIds);
        nextIds.delete(id);
        return { ...prev, actingIds: nextIds };
      });
    }
  }, [refresh]);

  const removeFriend = useCallback(async (id: number) => {
    setState((prev) => {
      const nextIds = new Set(prev.actingIds);
      nextIds.add(id);
      return { ...prev, actingIds: nextIds };
    });

    try {
      await friendshipService.deleteFriendship(id);
      setState((prev) => ({
        ...prev,
        friendships: prev.friendships.filter((friendship) => friendship.id !== id),
        error: null,
      }));
    } catch (err) {
      console.error("Failed to remove friend", err);
      setState((prev) => ({ ...prev, error: "Failed to remove friend" }));
    } finally {
      setState((prev) => {
        const nextIds = new Set(prev.actingIds);
        nextIds.delete(id);
        return { ...prev, actingIds: nextIds };
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    friendships: state.friendships,
    loading: state.loading,
    error: state.error,
    sending: state.sending,
    actingIds: state.actingIds,
    refresh,
    sendRequest,
    acceptRequest: (id: number) => actOnRequest(id, "accept"),
    declineRequest: (id: number) => actOnRequest(id, "decline"),
    removeFriend,
  };
};
