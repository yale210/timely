import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminBroadcastFormTitleField } from "@/components/admin/notifications/AdminBroadcastForm";

describe("AdminBroadcastFormTitleField Component", () => {
  it("renders and handles changes", () => {
    const onTitleChange = vi.fn();
    render(
      <AdminBroadcastFormTitleField
        title="Hello"
        titleLimit={10}
        isSubmitting={false}
        onTitleChange={onTitleChange}
      />
    );

    const input = screen.getByLabelText("Title");
    expect(input).toHaveValue("Hello");
    expect(screen.getByText("5/10")).toBeDefined();

    fireEvent.change(input, { target: { value: "New" } });
    expect(onTitleChange).toHaveBeenCalledWith("New");
  });
});
