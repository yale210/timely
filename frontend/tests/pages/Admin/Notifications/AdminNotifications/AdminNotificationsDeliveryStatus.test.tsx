import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { AdminNotificationsDeliveryStatus } from "@/pages/Admin/Notifications/AdminNotifications/AdminNotificationsDeliveryStatus";
import { type BroadcastJobStatusResponse } from "@/types";

describe("AdminNotificationsDeliveryStatus Component", () => {
  it("renders status when deliveryStatus is present", () => {
    const deliveryStatus = {
      id: 1,
      delivered_count: 5,
      recipient_count: 10,
      task_id: "task-1",
      status: "QUEUED",
    } as unknown as BroadcastJobStatusResponse;
    const delivery = {
      deliveryStatus,
      statusTone: "text-indigo-600",
      statusLabel: "QUEUED",
    };
    render(
      <BrowserRouter>
        <AdminNotificationsDeliveryStatus delivery={delivery} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Broadcast ID:/)).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("QUEUED")).toBeDefined();
  });

  it("renders empty state when no status", () => {
    const delivery = {
      deliveryStatus: null,
      statusTone: "",
      statusLabel: "",
    };
    render(
      <BrowserRouter>
        <AdminNotificationsDeliveryStatus delivery={delivery} />
      </BrowserRouter>
    );
    expect(screen.getByText("No broadcasts queued yet.")).toBeDefined();
  });
});
