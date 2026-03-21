import { type AdminNotificationTarget } from "@/types";

export const targetOptions: { label: string; value: AdminNotificationTarget }[] = [
  { label: "All users", value: "all" },
  { label: "Staff", value: "staff" },
  { label: "Admins", value: "admin" },
  { label: "Specific users", value: "users" },
];
