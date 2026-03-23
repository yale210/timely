import { type AdminNotificationTarget } from "@/types";

/** Maximum character count for broadcast titles. */
export const TITLE_LIMIT = 60;

/** Maximum character count for broadcast messages. */
export const MESSAGE_LIMIT = 240;

/** Available target audience options for admin broadcasts. */
export const targetOptions: { label: string; value: AdminNotificationTarget }[] = [
  { label: "All users", value: "all" },
  { label: "Staff", value: "staff" },
  { label: "Admins", value: "admin" },
  { label: "Specific users", value: "users" },
];
