import api from "@/services/api";
import type { Share } from "@/types";



export const getShares = async (): Promise<Share[]> => {
    const response = await api.get<Share[]>("/api/share_events/");
    return response.data;
}

export const sendShare = async (receiverUsername: string, eventID: string): Promise<void> => {
    const formData = new FormData()
    formData.append("Receiver", receiverUsername)
    formData.append("Event-ID", eventID)
    await api.post("/api/share_send/", formData)

    
  
};

export const replyShare = async (eventID: string, decision: string): Promise<void> => {

    const formData = new FormData()
    
    formData.append("Event-ID", eventID)
    formData.append("Decision", decision)
    await api.post("/api/share_accept/", formData)
  
};

