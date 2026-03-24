import api from "@/services/api";
import type { Assessment, AssessmentSubmission } from "@/types";

export const getAssessments = async (
  filters?: Record<string, string | number | boolean | null>,
): Promise<Assessment[]> => {
  const response = await api.get<Assessment[]>("/api/assessments/", {
    params: filters,
  });
  return response.data;
};

export const createAssessment = async (
  data: AssessmentSubmission,
): Promise<Assessment> => {
  const response = await api.post<Assessment>("/api/assessments/", data);
  return response.data;
};

export const updateAssessment = async (
  id: number,
  data: AssessmentSubmission,
): Promise<Assessment> => {
  const response = await api.patch<Assessment>(`/api/assessments/${id}/`, data);
  return response.data;
};
export const deleteAssessment = async (id: number): Promise<void> => {
  await api.delete(`/api/assessments/${id}/`);
};
