import { describe, expect, it, vi } from "vitest";
import {
  buildNotificationFilter,
  buildPaginationWindow,
  runBulkNotificationAction,
} from "@/hooks/notifications/notificationsPageUtils";
import { NotificationType } from "@/types";

describe("notificationsPageUtils", () => {
  it("builds filters for each supported tab", () => {
    expect(buildNotificationFilter("all")).toEqual({});
    expect(buildNotificationFilter("unread")).toEqual({ isRead: false });
    expect(buildNotificationFilter("system")).toEqual({ notificationType: NotificationType.SYSTEM });
    expect(buildNotificationFilter("tasks")).toEqual({ notificationType: NotificationType.TASK });
    expect(buildNotificationFilter("calendar")).toEqual({ notificationType: NotificationType.CALENDAR });
  });

  it("builds a centred pagination window", () => {
    expect(buildPaginationWindow(5, 10)).toEqual([3, 4, 5, 6, 7]);
    expect(buildPaginationWindow(1, 2)).toEqual([1, 2]);
  });

  it("runs the selected bulk action and refreshes context notifications", async () => {
    const markAllRead = vi.fn().mockResolvedValue(undefined);
    const deleteAllNotifications = vi.fn().mockResolvedValue(undefined);
    const fetchPage = vi.fn().mockResolvedValue(undefined);
    const fetchNotifications = vi.fn().mockResolvedValue(undefined);
    const setPage = vi.fn();

    await runBulkNotificationAction("delete_all", {
      markAllRead,
      deleteAllNotifications,
      fetchPage,
      fetchNotifications,
      setPage,
    });

    expect(deleteAllNotifications).toHaveBeenCalled();
    expect(setPage).toHaveBeenCalledWith(1);
    expect(fetchNotifications).toHaveBeenCalled();
    expect(markAllRead).not.toHaveBeenCalled();
  });
});
