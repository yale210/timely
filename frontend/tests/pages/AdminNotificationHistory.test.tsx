import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AdminNotificationHistory } from "@/pages/AdminNotificationHistory";
import { BrowserRouter } from "react-router-dom";
import * as notificationsApi from "@/api/notifications";

vi.mock("@/api/notifications", () => ({
    getBroadcastHistory: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importActual) => {
    const actual = await importActual<typeof import("react-router-dom")>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe("AdminNotificationHistory Page", () => {
    const mockData = {
        count: 2,
        next: null,
        previous: null,
        results: [
            {
                id: "job-1",
                title: "Test Broadcast 1",
                status: "COMPLETED",
                target_audience: "all",
                total_count: 10,
                success_count: 10,
                failure_count: 0,
                created_at: "2023-01-01T10:00:00Z",
            },
            {
                id: "job-2",
                title: "Test Broadcast 2",
                status: "FAILED",
                target_audience: "staff",
                total_count: 5,
                success_count: 2,
                failure_count: 3,
                created_at: "2023-01-02T10:00:00Z",
            },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(notificationsApi.getBroadcastHistory).mockResolvedValue(mockData as any);
    });

    it("renders the history table and handles loading state", async () => {
        render(
            <BrowserRouter>
                <AdminNotificationHistory />
            </BrowserRouter>
        );

        expect(screen.getByText("Notification history")).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText("Test Broadcast 1")).toBeInTheDocument();
            expect(screen.getByText("Test Broadcast 2")).toBeInTheDocument();
        });

        expect(screen.getByText("Completed")).toBeInTheDocument();
        expect(screen.getByText("Failed")).toBeInTheDocument();
    });

    it("filters history by search and select", async () => {
        const getHistorySpy = vi.spyOn(notificationsApi, "getBroadcastHistory");
        render(
            <BrowserRouter>
                <AdminNotificationHistory />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText("Test Broadcast 1")).toBeDefined());

        const searchInput = screen.getByPlaceholderText(/Search title.../i);
        fireEvent.change(searchInput, { target: { value: "specific" } });
        
        await waitFor(() => {
            expect(getHistorySpy).toHaveBeenCalledWith(expect.objectContaining({ q: "specific" }));
        });

        const statusSelect = screen.getByDisplayValue(/All statuses/i);
        fireEvent.change(statusSelect, { target: { value: "FAILED" } });

        await waitFor(() => {
            expect(getHistorySpy).toHaveBeenCalledWith(expect.objectContaining({ status: "FAILED" }));
        });
    })

    it("navigates to new notification page", async () => {
        render(
            <BrowserRouter>
                <AdminNotificationHistory />
            </BrowserRouter>
        );

        const newBtn = screen.getByText("New notification");
        fireEvent.click(newBtn);

        expect(mockNavigate).toHaveBeenCalledWith("/admin/notifications");
    });

    it("navigates to details on row click", async () => {
        render(
            <BrowserRouter>
                <AdminNotificationHistory />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText("Test Broadcast 1")).toBeDefined());

        fireEvent.click(screen.getByText("Test Broadcast 1"));
        expect(mockNavigate).toHaveBeenCalledWith("/admin/notifications/history/job-1");
    })

    it("handles error when fetching history fails", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.mocked(notificationsApi.getBroadcastHistory).mockRejectedValue(new Error("API Error"));

        render(
            <BrowserRouter>
                <AdminNotificationHistory />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Failed to load broadcast history.")).toBeInTheDocument();
        });
    })

    it("handles errors during load", async () => {
        vi.mocked(notificationsApi.getBroadcastHistory).mockRejectedValueOnce(new Error("Failed"));
        render(
            <BrowserRouter>
                <AdminNotificationHistory />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText(/Failed to load broadcast history/i)).toBeDefined());
    })
});
