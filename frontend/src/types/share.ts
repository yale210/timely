/**
 * Represents the response from the event sharing API.
 * @interface Share
 */
export interface Share {
  id: number,
  sender: number,
  receiver: number,
  sender_username: string,
  receiver_username: string,
  event_id: number,
  event_title: string,
}