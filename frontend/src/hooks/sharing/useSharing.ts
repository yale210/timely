import { useCallback, useEffect, useState } from "react";
import type { Share } from "@/types";
import * as shareService from "@/services/shareService";

const useSharesFetch = (
  setShares: React.Dispatch<React.SetStateAction<Share[]>>,
  setIsSharesLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setShareError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  return useCallback(async () => {
    setIsSharesLoading(true);
    try {
      const nextShares = await shareService.getShares();
      setShares(nextShares);
      setShareError(null);
    } catch (error) {
      console.error(error);
      setShares([]);
      setShareError("Failed to load shares.");
    } finally {
      setIsSharesLoading(false);
    }
  }, [setShares, setIsSharesLoading, setShareError]);
};

const handleShareError = (
  error: unknown,
  setShareError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  if (error instanceof Error) setShareError(error.message);
  else setShareError("? Unknown Error");
};

const useShareEventAction = (
  setIsSharing: React.Dispatch<React.SetStateAction<boolean>>,
  setShareError: React.Dispatch<React.SetStateAction<string | null>>,
  fetchShares: () => Promise<void>
) => {
  return useCallback(async (username: string, eventID: string) => {
    setIsSharing(true);
    setShareError(null);
    try {
      await shareService.sendShare(username, eventID);
      await fetchShares();
    } catch (error) {
      handleShareError(error, setShareError);
    } finally {
      setIsSharing(false);
    }
  }, [fetchShares, setShareError, setIsSharing]);
};

const useReplyShareAction = (
  setshareProcessing: React.Dispatch<React.SetStateAction<number | null>>,
  setShareError: React.Dispatch<React.SetStateAction<string | null>>,
  fetchShares: () => Promise<void>
) => {
  return useCallback(async (eventID: string, decision: string, id: number) => {
    setshareProcessing(id);
    try {
      await shareService.replyShare(eventID, decision);
      await fetchShares();
    } catch (error) {
      console.error(error);
      setShareError("Failed to reply to the share request.");
    } finally {
      setshareProcessing(null);
    }
  }, [fetchShares, setShareError, setshareProcessing]);
};

/**
 * Manage gradebook data and gradebook page UI state.
 */
export function useSharing() {
  const [shares, setShares] = useState<Share[]>([]);
  const [isSharesloading, setIsSharesLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareProcessing, setshareProcessing] = useState<number | null>(null);

  const fetchShares = useSharesFetch(setShares, setIsSharesLoading, setShareError);
  const shareEvent = useShareEventAction(setIsSharing, setShareError, fetchShares);
  const replyShare = useReplyShareAction(setshareProcessing, setShareError, fetchShares);

  useEffect(() => { void fetchShares(); }, [fetchShares]);

  return {
    shares,
    isSharesloading,
    isSharing,
    shareError,
    shareProcessing,
    shareEvent,
    replyShare,
    fetchShares,
  };
}
