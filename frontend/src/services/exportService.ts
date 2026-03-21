import api from "@/services/api";

/**
 * Retrieves the weekly task summary for a given week.
 * @param date - Optional date (YYYY-MM-DD) within the desired week.
 * @returns A promise resolving to the weekly statistics.
 */
export const exportEvents = async (): Promise<string> => {
  
  const response = await api.get("/api/export", {
    headers: {
        'Authorization': `Token ${localStorage.getItem('auth_token')}`
    }
  });

  console.log("API: ", response)

  if (response.status != 200) {
    throw new Error("Error Exporting Events")
  }
  return response.data
  
};
