import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminHistoryRecipientRow } from "@/components/admin/notifications/AdminHistoryDetailRecipientsTable";
import { type BroadcastRecipientDetail } from "@/types";

const makeRecipient = (
  overrides: Partial<BroadcastRecipientDetail> = {},
): BroadcastRecipientDetail => ({
  id: 1,
  recipient: 1,
  username: "alice",
  email: "alice@test.com",
  status: "SENT",
  error_code: "",
  error_message: "",
  last_attempt_at: null,
  notification: null,
  ...overrides,
});

const renderRow = (recipient: BroadcastRecipientDetail) =>
  render(
    <table>
      <tbody>
        <AdminHistoryRecipientRow recipient={recipient} />
      </tbody>
    </table>,
  );

describe("AdminHistoryRecipientRow Component", () => {
  it("renders recipient information", () => {
    renderRow(makeRecipient());

    expect(screen.getByText("alice")).toBeDefined();
    expect(screen.getByText("alice@test.com")).toBeDefined();
    expect(screen.getByText("Sent")).toBeDefined();
  });

  it("renders SENT_NO_PUSH with correct label", () => {
    renderRow(makeRecipient({ status: "SENT_NO_PUSH" }));

    expect(screen.getByText("No push devices")).toBeDefined();
  });

  it("renders PENDING with correct label", () => {
    renderRow(makeRecipient({ status: "PENDING" }));

    expect(screen.getByText("Pending")).toBeDefined();
  });

  it("renders FAILED with correct label", () => {
    renderRow(makeRecipient({ status: "FAILED" }));

    expect(screen.getByText("Failed")).toBeDefined();
  });

   it("shows tooltip for each status", () => {
     const statuses: {
       status: BroadcastRecipientDetail["status"];
       tooltip: string;
     }[] = [
      {
        status: "PENDING",
        tooltip: "In-app notification created. Push delivery is still queued.",
      },
      {
        status: "SENT",
        tooltip: "In-app notification created. Push delivered to at least one device.",
      },
      {
        status: "SENT_NO_PUSH",
        tooltip: "In-app notification created, but the user has no push-enabled devices.",
      },
      {
        status: "FAILED",
        tooltip: "In-app notification created, but push delivery failed for all devices.",
      },
    ];

    for (const { status, tooltip } of statuses) {
      const { unmount } = renderRow(makeRecipient({ status }));

      const badge = screen.getByTitle(tooltip);
      expect(badge).toBeDefined();

      unmount();
    }
  });

  it("applies correct badge class for SENT_NO_PUSH", () => {
    renderRow(makeRecipient({ status: "SENT_NO_PUSH" }));

    const badge = screen.getByText("No push devices");
    expect(badge.className).toContain("bg-amber-100");
    expect(badge.className).toContain("text-amber-700");
  });

  it("applies cursor-help class on status badge", () => {
    renderRow(makeRecipient());

    const badge = screen.getByText("Sent");
    expect(badge.className).toContain("cursor-help");
  });
});
