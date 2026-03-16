/**
 * Represents a friendship between two users.
 * @interface Friendship
 */
export interface Friendship {
  id: number;
  sender: number;
  receiver: number;
  sender_username?: string;
  receiver_username_display?: string;
  sender_name?: string;
  receiver_name?: string;
  sender_avatar?: string | null;
  receiver_avatar?: string | null;
  state: "SENT" | "ACCEPTED" | "DECLINED";
  updated_at?: string | null;
}