import api from "@/services/api";
import type { Assessment, AssessmentSubmission } from "@/types";

/**
 * Retrieves assessments for the current user.
 * @param filters - Optional query filters.
 * @returns The fetched assessments.
 */
export const getAssessments = async (
  filters?: Record<string, string | number | boolean | null>,
): Promise<Assessment[]> => {
  const response = await api.get<Assessment[]>("/api/assessments/", {
    params: filters,
  });
  return response.data;
};

/**
 * Creates a new assessment.
 * @param data - Assessment payload to create.
 * @returns The created assessment.
 */
export const createAssessment = async (
  data: AssessmentSubmission,
): Promise<Assessment> => {
  const response = await api.post<Assessment>("/api/assessments/", data);
  return response.data;
};

/**
 * Updates an existing assessment.
 * @param id - Assessment identifier.
 * @param data - Assessment changes to apply.
 * @returns The updated assessment.
 */
export const updateAssessment = async (
  id: number,
  data: AssessmentSubmission,
): Promise<Assessment> => {
  const response = await api.patch<Assessment>(`/api/assessments/${id}/`, data);
  return response.data;
};

/**
 * Deletes an assessment.
 * @param id - Assessment identifier.
 * @returns A promise that resolves when deletion completes.
 */
export const deleteAssessment = async (id: number): Promise<void> => {
  await api.delete(`/api/assessments/${id}/`);
};
