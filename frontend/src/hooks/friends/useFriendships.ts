import { useCallback, useEffect, useState } from "react";
import type { Friendship } from "@/types";
import * as friendshipService from "@/services/friendshipService";
import { formatDjangoFormError } from "@/utils/apiErrors";

const FRIENDSHIP_EVENT = "friendships-changed";

type FriendshipEventDetail =
  | { kind: "upsert"; friendship: Friendship }
  | { kind: "remove"; friendshipId: number }
  | { kind: "bulk"; friendships: Friendship[] };

const emitFriendshipEvent = (detail: FriendshipEventDetail) => {
  window.dispatchEvent(new CustomEvent<FriendshipEventDetail>(FRIENDSHIP_EVENT, { detail }));
};

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

  const sendRequest = useCallback(async (receiverUsername: string) => {
    setState((prev) => ({ ...prev, sending: true }));
    try {
      const friendship = await friendshipService.sendFriendRequest(receiverUsername);
      setState((prev) => {
        const exists = prev.friendships.some((item) => item.id === friendship.id);
        const friendships = exists
          ? prev.friendships.map((item) => (item.id === friendship.id ? friendship : item))
          : [friendship, ...prev.friendships];
        return { ...prev, friendships, sending: false, error: null };
      });
      emitFriendshipEvent({ kind: "upsert", friendship });
    } catch (err) {
      const parsed = formatDjangoFormError(err);
      console.error("Failed to send friend request", err);
      setState((prev) => ({
        ...prev,
        sending: false,
        error: parsed.message || "Failed to send friend request",
      }));
    }
  }, []);

  const actOnRequest = useCallback(async (id: number, action: "accept" | "decline") => {
    let previousFriendships: Friendship[] | null = null;
    let updatedFriendship: Friendship | null = null;
    setState((prev) => {
      const nextIds = new Set(prev.actingIds);
      nextIds.add(id);
      previousFriendships = prev.friendships;
      const nextState = action === "accept" ? "ACCEPTED" : "DECLINED";
      const friendships = prev.friendships.map((friendship) => {
        if (friendship.id !== id) return friendship;
        const nextFriendship = { ...friendship, state: nextState } as Friendship;
        updatedFriendship = nextFriendship;
        return nextFriendship;
      });
      return { ...prev, actingIds: nextIds, friendships, error: null };
    });

    try {
      if (updatedFriendship) {
        emitFriendshipEvent({ kind: "upsert", friendship: updatedFriendship });
      }
      if (action === "accept") {
        await friendshipService.acceptFriendRequest(id);
      } else {
        await friendshipService.declineFriendRequest(id);
      }
    } catch (err) {
      console.error("Failed to update friend request", err);
      setState((prev) => ({
        ...prev,
        friendships: previousFriendships ?? prev.friendships,
        error: "Failed to update friend request",
      }));
      if (previousFriendships) {
        emitFriendshipEvent({ kind: "bulk", friendships: previousFriendships });
      }
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
      emitFriendshipEvent({ kind: "remove", friendshipId: id });
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

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const customEvent = event as CustomEvent<FriendshipEventDetail>;
      const detail = customEvent.detail;
      if (!detail) {
        void refresh();
        return;
      }
      setState((prev) => {
        if (detail.kind === "upsert") {
          const exists = prev.friendships.some((item) => item.id === detail.friendship.id);
          const friendships = exists
            ? prev.friendships.map((item) =>
              item.id === detail.friendship.id ? detail.friendship : item,
            )
            : [detail.friendship, ...prev.friendships];
          return { ...prev, friendships };
        }
        if (detail.kind === "remove") {
          return {
            ...prev,
            friendships: prev.friendships.filter((item) => item.id !== detail.friendshipId),
          };
        }
        return { ...prev, friendships: detail.friendships };
      });
    };

    window.addEventListener(FRIENDSHIP_EVENT, handleEvent);
    return () => {
      window.removeEventListener(FRIENDSHIP_EVENT, handleEvent);
    };
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 20000);

    const handleFocus = () => {
      void refresh();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
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
