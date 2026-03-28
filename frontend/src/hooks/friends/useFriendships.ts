import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from "react";
import type { Friendship } from "@/types";
import * as friendshipService from "@/services/friendshipService";
import { formatDjangoFormError } from "@/utils/apiErrors";

const FRIENDSHIP_EVENT = "friendships-changed";

type FriendshipEventDetail =
  | { kind: "upsert"; friendship: Friendship }
  | { kind: "remove"; friendshipId: number }
  | { kind: "bulk"; friendships: Friendship[] };

/**
 * Broadcasts friendship updates to all listeners.
 * @param detail - Update payload describing the change.
 */
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

const handleUpsertEvent = (
  prev: UseFriendshipsState,
  detail: Extract<FriendshipEventDetail, { kind: "upsert" }>
) => {
  const exists = prev.friendships.some((item) => item.id === detail.friendship.id);
  const friendships = exists
    ? prev.friendships.map((item) => (item.id === detail.friendship.id ? detail.friendship : item))
    : [detail.friendship, ...prev.friendships];
  return { ...prev, friendships };
};

const handleCustomEvent = (
  event: Event,
  setState: Dispatch<SetStateAction<UseFriendshipsState>>,
  refresh: () => Promise<void>
) => {
  const customEvent = event as CustomEvent<FriendshipEventDetail>;
  const detail = customEvent.detail;
  if (!detail) {
    void refresh();
    return;
  }
  setState((prev) => {
    if (detail.kind === "upsert") return handleUpsertEvent(prev, detail);
    if (detail.kind === "remove") {
      return {
        ...prev,
        friendships: prev.friendships.filter((item) => item.id !== detail.friendshipId),
      };
    }
    return { ...prev, friendships: detail.friendships };
  });
};

const useFriendshipEvents = (
  setState: Dispatch<SetStateAction<UseFriendshipsState>>,
  refresh: () => Promise<void>
) => {
  useEffect(() => {
    const handleEvent = (event: Event) => handleCustomEvent(event, setState, refresh);
    window.addEventListener(FRIENDSHIP_EVENT, handleEvent);
    return () => window.removeEventListener(FRIENDSHIP_EVENT, handleEvent);
  }, [setState, refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => { void refresh(); }, 20000);
    const handleFocus = () => { void refresh(); };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh]);
};

const applyOptimisticUpdate = (
  prev: UseFriendshipsState,
  id: number,
  action: "accept" | "decline"
) => {
  const nextState = action === "accept" ? "ACCEPTED" : "DECLINED";
  const nextIds = new Set(prev.actingIds);
  nextIds.add(id);
  const friendships = prev.friendships.map((f) =>
    f.id !== id ? f : ({ ...f, state: nextState } as Friendship)
  );
  return { ...prev, actingIds: nextIds, friendships, error: null };
};

const handleActFailure = (
  setState: Dispatch<SetStateAction<UseFriendshipsState>>,
  previousFriendships: Friendship[]
) => {
  setState((prev) => ({
    ...prev,
    friendships: previousFriendships,
    error: "Failed to update friend request",
  }));
  emitFriendshipEvent({ kind: "bulk", friendships: previousFriendships });
};

const executeActOnRequest = async (
  id: number,
  action: "accept" | "decline",
  updatedFriendship: Friendship | null
) => {
  if (updatedFriendship) emitFriendshipEvent({ kind: "upsert", friendship: updatedFriendship });
  if (action === "accept") await friendshipService.acceptFriendRequest(id);
  else await friendshipService.declineFriendRequest(id);
};

const useRefreshHook = (setState: Dispatch<SetStateAction<UseFriendshipsState>>) => {
  return useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const friendships = await friendshipService.getFriendships();
      setState((prev) => ({ ...prev, friendships, loading: false, error: null }));
    } catch (err) {
      console.error("Failed to load friendships", err);
      setState((prev) => ({ ...prev, loading: false, error: "Failed to load friendships" }));
    }
  }, [setState]);
};

const useSendRequestHook = (setState: Dispatch<SetStateAction<UseFriendshipsState>>) => {
  return useCallback(async (receiverUsername: string) => {
    setState((prev) => ({ ...prev, sending: true }));
    try {
      const friendship = await friendshipService.sendFriendRequest(receiverUsername);
      setState((prev) => {
        const payload = { kind: "upsert" as const, friendship };
        return { ...handleUpsertEvent(prev, payload), sending: false, error: null };
      });
      emitFriendshipEvent({ kind: "upsert", friendship });
    } catch (err) {
      const parsed = formatDjangoFormError(err);
      console.error("Failed to send friend request", err);
      setState((prev) => ({
        ...prev,
        sending: false,
        error: parsed.message ?? "Failed to send friend request",
      }));
    }
  }, [setState]);
};

const useActOnRequestHook = (
  state: UseFriendshipsState,
  setState: Dispatch<SetStateAction<UseFriendshipsState>>
) => {
  return useCallback(async (id: number, action: "accept" | "decline") => {
    const previousFriendships = state.friendships;
    let updatedFriendship: Friendship | null = null;
    setState((prev) => {
      const updated = applyOptimisticUpdate(prev, id, action);
      updatedFriendship = updated.friendships.find((f) => f.id === id) ?? null;
      return updated;
    });

    try {
      await executeActOnRequest(id, action, updatedFriendship);
    } catch (err) {
      console.error("Failed to update friend request", err);
      handleActFailure(setState, previousFriendships);
    } finally {
      setState((prev) => {
        const nextIds = new Set(prev.actingIds);
        nextIds.delete(id);
        return { ...prev, actingIds: nextIds };
      });
    }
  }, [state.friendships, setState]);
};

const useRemoveFriendHook = (setState: Dispatch<SetStateAction<UseFriendshipsState>>) => {
  return useCallback(async (id: number) => {
    setState((prev) => {
      const nextIds = new Set(prev.actingIds);
      nextIds.add(id);
      return { ...prev, actingIds: nextIds };
    });
    try {
      await friendshipService.deleteFriendship(id);
      setState((prev) => ({
        ...prev,
        friendships: prev.friendships.filter((f) => f.id !== id),
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
  }, [setState]);
};

/**
 * Provides friendship state and actions for the current user.
 */
export const useFriendships = () => {
  const [state, setState] = useState<UseFriendshipsState>({
    friendships: [],
    loading: false,
    error: null,
    sending: false,
    actingIds: new Set(),
  });

  const refresh = useRefreshHook(setState);
  const sendRequest = useSendRequestHook(setState);
  const actOnRequest = useActOnRequestHook(state, setState);
  const removeFriend = useRemoveFriendHook(setState);

  useFriendshipEvents(setState, refresh);

  useEffect(() => { void refresh(); }, [refresh]);

  return {
    ...state,
    refresh,
    sendRequest,
    acceptRequest: (id: number) => actOnRequest(id, "accept"),
    declineRequest: (id: number) => actOnRequest(id, "decline"),
    removeFriend,
  };
};
