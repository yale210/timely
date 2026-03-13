import api from "@/services/api";
import type { Assessment, AssessmentDetails } from "@/types/assessment";


/**
 * 
 */
export const getAssessments = async () : Promise<Assessment[]> => {
  const response = await api.get<Assessment[]>("/api/assessments/");
  return response.data;
};

/**
 * 
 */
export const createAssessment = async (data: AssessmentDetails): Promise<Assessment> => {
    const response = await api.post<Assessment>("/api/assessments/", data);
    return response.data;
}


/**
 * 
 */
export const updateAssessment = async (id: number, data: Partial<AssessmentDetails>): Promise<Assessment> => {
    const response = await api.patch<Assessment>(`/api/assessments/${id}/`, data);
    return response.data;
}



/**
 * 
 */
export const deleteAssessment = async (id: number): Promise<void> => {
  await api.delete(`/api/assessments/${id}/`);
};
