import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AdminNotificationHistoryDetail } from "../../src/pages/AdminNotificationHistoryDetail";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import * as notificationsApi from "../../src/api/notifications";
import type { 
    BroadcastJobDetail, 
    BroadcastJobStatusResponse, 
    RetryBroadcastResponse,
    BroadcastRecipientDetail 
} from "../../src/types/notification";

vi.mock("../../src/api/notifications", () => ({
    getBroadcastDetail: vi.fn(),
    getBroadcastStatus: vi.fn(),
    retryFailedBroadcast: vi.fn(),
}));

const mockDetail: BroadcastJobDetail = {
    id: 1,
    title: "Test Job",
    message: "Test Message",
    target: "all_users",
    status: "COMPLETED",
    task_id: "task-1",
    recipient_count: 2,
    delivered_count: 1,
    failed_count: 1,
    sender: 1,
    sender_username: "admin",
    audience_filters: {},
    audience_snapshot: { recipient_count: 2 },
    provider_errors: [],
    queued_at: "2200-10-01T10:00:00Z",
    started_at: "2200-10-01T10:00:01Z",
    completed_at: "2200-10-01T10:00:05Z",
    retry_of: null,
    recipients: [
        { 
            id: 1, 
            recipient: 1, 
            username: "user1", 
            email: "user1@test.com", 
            status: "FAILED", 
            error_code: "500", 
            error_message: "Network Error", 
            last_attempt_at: null, 
            notification: null,
            delivered_at: null,
        } as BroadcastRecipientDetail,
        { 
            id: 2, 
            recipient: 2, 
            username: "user2", 
            email: "user2@test.com", 
            status: "SENT", 
            error_code: "", 
            error_message: "", 
            last_attempt_at: null, 
            notification: null,
            delivered_at: null,
        } as BroadcastRecipientDetail,
    ],
};

const mockStatus: BroadcastJobStatusResponse = {
    id: 1,
    status: "COMPLETED",
    recipient_count: 2,
    delivered_count: 1,
    failed_count: 1,
    queued_at: "2200-10-01T10:00:00Z",
    started_at: "2200-10-01T10:00:01Z",
    completed_at: "2200-10-01T10:00:05Z",
    task_id: "task-123",
    updated_at: "2200-10-01T10:00:05Z",
};

describe("AdminNotificationHistoryDetail Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(notificationsApi.getBroadcastDetail).mockResolvedValue(mockDetail);
        vi.mocked(notificationsApi.getBroadcastStatus).mockResolvedValue(mockStatus);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const renderWithRouter = (id = "1") => {
        return render(
            <MemoryRouter initialEntries={[`/admin/notifications/history/${id}`]}>
                <Routes>
                    <Route 
                        path="/admin/notifications/history/:id" 
                        element={<AdminNotificationHistoryDetail />} 
                    />
                </Routes>
            </MemoryRouter>
        );
    };

    it("renders job details and status", async () => {
        renderWithRouter();
        expect(await screen.findByText("Test Job")).toBeDefined();
        expect(screen.getByText("Test Message")).toBeDefined();
    });

    it("handles invalid broadcast id", async () => {
        renderWithRouter("abc");
        expect(await screen.findByText("Invalid broadcast ID.")).toBeDefined();
    });

    it("handles API failure in load", async () => {
        vi.spyOn(console, "error").mockImplementation(() => { /* skip */ });
        vi.mocked(notificationsApi.getBroadcastDetail).mockRejectedValue(new Error("API Error"));
        renderWithRouter();
        expect(await screen.findByText("Failed to load broadcast detail.")).toBeDefined();
    });

    it("handles retry of failed broadcast", async () => {
        vi.mocked(notificationsApi.retryFailedBroadcast).mockResolvedValue({ broadcast_id: 1 } as RetryBroadcastResponse);
        
        renderWithRouter();

        const retryBtn = await screen.findByRole("button", { name: /retry failed recipients/i });
        fireEvent.click(retryBtn);

        expect(screen.getByText("Retry failed recipients?")).toBeDefined();
        const confirmBtn = screen.getByRole("button", { name: /retry failed$/i });
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(notificationsApi.retryFailedBroadcast).toHaveBeenCalledWith(1);
        });
    });
});
