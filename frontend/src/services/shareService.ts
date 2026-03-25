import api from "@/services/api";
import type { Share } from "@/types";

/**
 * Returns all of the user's share requests
 */
export const getShares = async (): Promise<Share[]> => {
    const response = await api.get<Share[]>("/api/share_events/");
    return response.data;
}

/**
 * Sends an event share request to another user
 * @param receiverUsername - The username of the user that is being sent the event.
 * @param eventID - The ID of the event in DB.
 */
export const sendShare = async (receiverUsername: string, eventID: string): Promise<void> => {
    const formData = new FormData()
    formData.append("Receiver", receiverUsername)
    formData.append("Event-ID", eventID)
    await api.post("/api/share_send/", formData)
};

/**
 * Allows the user to reply to a share request with an acception or a rejection
 * @param eventID - The ID of the event in DB.
 * @param decision - Accept or Reject, what the user wants to do with an event sharing request.
 */
export const replyShare = async (eventID: string, decision: string): Promise<void> => {
    const formData = new FormData()
    formData.append("Event-ID", eventID)
    formData.append("Decision", decision)
    await api.post("/api/share_accept/", formData)
};

