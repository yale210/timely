import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminHistoryRecipientRow } from "@/components/admin/notifications/AdminHistoryDetailRecipientsTable";
import { type BroadcastRecipientDetail } from "@/types";

describe("AdminHistoryRecipientRow Component", () => {
  it("renders recipient information", () => {
    const recipient: BroadcastRecipientDetail = {
      id: 1,
      recipient: 1,
      username: "alice",
      email: "alice@test.com",
      status: "SENT",
      error_code: "",
      error_message: "",
      last_attempt_at: null,
      notification: null,
    };
    render(
      <table>
        <tbody>
          <AdminHistoryRecipientRow recipient={recipient} />
        </tbody>
      </table>
    );

    expect(screen.getByText("alice")).toBeDefined();
    expect(screen.getByText("alice@test.com")).toBeDefined();
    expect(screen.getByText("SENT")).toBeDefined();
  });
});
