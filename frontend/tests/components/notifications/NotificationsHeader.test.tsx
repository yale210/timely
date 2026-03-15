import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotificationsHeader } from "@/components/notifications/NotificationsHeader";
import { filterTabs } from "@/hooks/notifications/useNotificationsPage";

describe("NotificationsHeader", () => {
  it("renders tabs and forwards bulk actions", () => {
    const onTabChange = vi.fn();
    const onMarkAllRead = vi.fn();
    const onDeleteAll = vi.fn();

    render(
      <NotificationsHeader
        activeTab="all"
        onTabChange={onTabChange}
        onMarkAllRead={onMarkAllRead}
        onDeleteAll={onDeleteAll}
      />,
    );

    filterTabs.forEach((tab) => {
      expect(screen.getByRole("button", { name: tab.label })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Unread" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete all" }));

    expect(onTabChange).toHaveBeenCalledWith("unread");
    expect(onMarkAllRead).toHaveBeenCalled();
    expect(onDeleteAll).toHaveBeenCalled();
  });
});
