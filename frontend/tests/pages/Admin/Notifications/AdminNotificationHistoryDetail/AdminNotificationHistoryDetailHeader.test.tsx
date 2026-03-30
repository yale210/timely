import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { AdminNotificationHistoryDetailHeader } from "@/components/admin/notifications";

describe("AdminNotificationHistoryDetailHeader Component", () => {
  it("renders correctly and handles retry click", () => {
    const onRetry = vi.fn();
    render(
      <BrowserRouter>
        <AdminNotificationHistoryDetailHeader
          title="Test Broadcast"
          queuedAt="2023-01-01T12:00:00Z"
          failedRecipientsCount={5}
          onRetryClick={onRetry}
        />
      </BrowserRouter>
    );

    expect(screen.getByText("Test Broadcast")).toBeDefined();
    
    fireEvent.click(screen.getByText("Retry failed recipients"));
    expect(onRetry).toHaveBeenCalled();
  });
});
