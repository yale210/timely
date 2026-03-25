import api from "@/services/api";

/**
 * Exports events from the backend API.
 * @returns Promise<string> - Exported Event Data Response.
 */
export const exportEvents = async (): Promise<string> => {
  
  const response = await api.get<string>("/api/export/", {
    headers: {
        'Authorization': `Token ${localStorage.getItem('auth_token')}`
    }
  });

  if (response.status !== 200) {
    throw new Error("Error Exporting Events")
  }
  return response.data
  
};
