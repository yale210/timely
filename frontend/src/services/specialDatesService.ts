import api from "@/services/api";
import type { SpecialDate } from "@/types";

export const getSpecialDates = async (): Promise<SpecialDate[]> => {
  const response = await api.get<SpecialDate[]>("/api/special-dates/");
  return response.data;
};

export const createSpecialDate = async (
  payload: Pick<SpecialDate, "date" | "text">,
): Promise<SpecialDate> => {
  const response = await api.post<SpecialDate>("/api/special-dates/", payload);
  return response.data;
};

export const deleteSpecialDate = async (id: number): Promise<void> => {
  await api.delete(`/api/special-dates/${id}/`);
};
