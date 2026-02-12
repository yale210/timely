import api from "./api";
import { type Event, type EventSubmission } from "../types";

/**
 * Retrieves a list of events from the server.
 * @returns A promise that resolves to an array of event objects.
 */
export const getEvents = async (): Promise<Event[]> => {
  const response = await api.get<Event[]>("/api/events/");
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
 * @returns A promise that resolves to the modified event object.
 */
export const updateEvent = async (id: number, data: EventSubmission): Promise<Event> => {
  const response = await api.patch<Event>(`/api/events/${id}/`, data);
  return response.data;
};

/**
 * Removes an event from the server.
 * @param id - The unique identifier of the event to be deleted.
 * @returns A promise that resolves once the event has been successfully removed.
 */
export const deleteEvent = async (id: number): Promise<void> => {
  await api.delete(`/api/events/${id}/`);
};
