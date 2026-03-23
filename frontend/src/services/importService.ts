import api from "@/services/api";

interface ImportResponse {
  message: string;
}

/**
 * Retrieves the weekly task summary for a given week.
 * @param date - Optional date (YYYY-MM-DD) within the desired week.
 * @returns A promise resolving to the weekly statistics.
 */
export const importEvents = async (file: File): Promise<string> => {
    const data = new FormData()
    data.append("file", file)


    const response = await api.post<ImportResponse>("/api/import/", data, {
        headers: {
            'Authorization': `Token ${localStorage.getItem('auth_token')}`
        },
    });

    if (response.status !== 200) {
        throw new Error("Error Importing Events")
    }
    
    alert(response.data.message)
    window.location.reload()
    
    return response.data.message
};
  
