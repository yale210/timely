import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminBroadcastFormMessageField } from "@/components/admin/notifications/AdminBroadcastForm/AdminBroadcastFormMessageField";

describe("AdminBroadcastFormMessageField Component", () => {
  it("renders and handles changes", () => {
    const onMessageChange = vi.fn();
    render(
      <AdminBroadcastFormMessageField
        message="Hello world"
        messageLimit={50}
        isSubmitting={false}
        onMessageChange={onMessageChange}
      />
    );

    const textarea = screen.getByLabelText("Message");
    expect(textarea).toHaveValue("Hello world");
    expect(screen.getByText("11/50")).toBeDefined();

    fireEvent.change(textarea, { target: { value: "New message" } });
    expect(onMessageChange).toHaveBeenCalledWith("New message");
  });
});
