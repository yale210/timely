import { useCallback, useEffect, useState } from "react";
import type { Share } from "@/types";
import * as shareService from "@/services/shareService";
import axios from "axios";



/**
 * Manage gradebook data and gradebook page UI state.
 */
export function useSharing() {
  const [shares, setShares] = useState<Share[]>([]);
  const [isSharesloading, setIsSharesLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareProcessing, setshareProcessing] = useState<number | null>(null);

    
  
    
    const fetchShares = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchShares();
    }, []);


    const shareEvent = useCallback(async (username: string, eventID: string) => {
        setIsSharing(true);
        setShareError(null);
    
        try {
          await shareService.sendShare(username, eventID);

          await fetchShares();
        
        } catch (error) {

          if (axios.isAxiosError(error)) {
            const message = error.response?.data?.detail|| "Please enter a valid username and ID.";
            console.log(error.response?.data?.detail)
            console.log("AAAAA")
            setShareError(message)
          }
          
          else {
            setShareError("Please enter a valid username and ID.");
          }
          
        } finally {
          setIsSharing(false);
        }
      }, [fetchShares]);

    

    const replyShare = useCallback(async (eventID: string, decision: string, id: number) => {
        setshareProcessing(id);
    
        try {
          await shareService.replyShare(eventID, decision);

          await fetchShares();
        
        } catch (error) {
          console.error(error);
          setShareError("Failed to share reply.");
        } finally {
          setshareProcessing(null);
        }
      }, [fetchShares]);


  return {
    shares,
    isSharesloading,
    isSharing,
    shareError,
    shareProcessing,
    shareEvent,
    replyShare,
    fetchShares,
  }
}

