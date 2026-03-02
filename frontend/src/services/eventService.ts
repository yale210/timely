import api from "./api";
import {
  type Event,
  type EventMutationContext,
  type EventSubmission,
} from "../types";

/**
 * Retrieves a list of events from the server.
 * @param params - Optional date window for backend expansion.
 * @param params.start_date - Inclusive window start date (`YYYY-MM-DD`).
 * @param params.end_date - Inclusive window end date (`YYYY-MM-DD`).
 * @returns A promise that resolves to an array of event objects.
 */
export const getEvents = async (
  params?: { start_date: string; end_date: string },
): Promise<Event[]> => {
  const response = await api.get<Event[]>("/api/events/", { params });
  return response.data;
};

/**
 * Creates a new event on the server.
 * @param data - The data required to initialise a new event.
 * @returns A promise that resolves to the newly created event object.
 */
export const createEvent = async (data: EventSubmission): Promise<Event> => {
  const response = await api.post<Event>("/api/events/", data);
  return response.data;
};

/**
 * Updates an existing event on the server.
 * @param id - The unique identifier of the event to be updated.
 * @param data - The updated information for the event.
 * @param context - Optional recurring mutation context (`scope`, `original_start_time`).
 * @returns A promise that resolves to the modified event object.
 */
export const updateEvent = async (
  id: number,
  data: EventSubmission,
  context?: EventMutationContext,
): Promise<Event> => {
  const response = await api.patch<Event>(`/api/events/${id}/`, data, {
    params: context,
  });
  return response.data;
};

/**
 * Removes an event from the server.
 * @param id - The unique identifier of the event to be deleted.
 * @param context - Optional recurring mutation context (`scope`, `original_start_time`).
 * @returns A promise that resolves once the event has been successfully removed.
 */
export const deleteEvent = async (
  id: number,
  context?: EventMutationContext,
): Promise<void> => {
  await api.delete(`/api/events/${id}/`, { params: context });
};

/**
 * Reverts an overridden recurring instance back to its parent series behavior.
 * @param id - The recurring parent event identifier.
 * @param originalStartTime - The UTC ISO anchor time of the overridden instance.
 * @returns A promise that resolves once the override is reverted.
 */
export const revertEventInstance = async (
  id: number,
  originalStartTime: string,
): Promise<void> => {
  await api.post(`/api/events/${id}/revert-instance/`, null, {
    params: { original_start_time: originalStartTime },
  });
};

/**
 * Retrieves the backend server time for client/server clock skew checks.
 * @returns A promise that resolves to an object containing the current server time in ISO format.
 */
export const getServerTime = async (): Promise<{ server_time: string }> => {
  const response = await api.get<{ server_time: string }>("/api/events/server_time/");
  return response.data;
};
