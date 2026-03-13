import api from "@/services/api";
import type { Friendship } from "@/types";

/**
 * Retrieves friendships for the current user.
 */
export const getFriendships = async (): Promise<Friendship[]> => {
  const response = await api.get<Friendship[]>("/api/friendships/");
  return response.data;
};

/**
 * Sends a friend request to the specified user id.
 */
export const sendFriendRequest = async (receiver: number): Promise<Friendship> => {
  const response = await api.post<Friendship>("/api/friendships/", { receiver });
  return response.data;
};

/**
 * Accepts a friend request.
 */
export const acceptFriendRequest = async (id: number): Promise<void> => {
  await api.post(`/api/friendships/${id}/accept/`);
};

/**
 * Declines a friend request.
 */
export const declineFriendRequest = async (id: number): Promise<void> => {
  await api.post(`/api/friendships/${id}/decline/`);
};

/**
 * Removes a friendship.
 */
export const deleteFriendship = async (id: number): Promise<void> => {
  await api.delete(`/api/friendships/${id}/`);
};
