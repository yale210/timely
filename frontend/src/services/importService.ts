import api from "@/services/api";

interface ImportResponse {
  message: string;
}

/**
 * Imports the user's event data file.
 * @param file - The file the user uploads.
 * @returns A response containing how many events were imported.
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
  
