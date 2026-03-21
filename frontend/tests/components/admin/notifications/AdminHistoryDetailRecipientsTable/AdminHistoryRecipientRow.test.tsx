import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminHistoryRecipientRow } from "@/components/admin/notifications/AdminHistoryDetailRecipientsTable/AdminHistoryRecipientRow";
import { type BroadcastRecipientDetail } from "@/types";

describe("AdminHistoryRecipientRow Component", () => {
  it("renders recipient information", () => {
    const recipient: BroadcastRecipientDetail = {
      id: 1,
      username: "alice",
      email: "alice@test.com",
      status: "delivered",
      error_message: null,
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
    expect(screen.getByText("delivered")).toBeDefined();
  });
});
