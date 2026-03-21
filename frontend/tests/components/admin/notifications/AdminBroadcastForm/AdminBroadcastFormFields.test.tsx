import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminBroadcastFormFields } from "@/components/admin/notifications/AdminBroadcastForm/AdminBroadcastFormFields";

describe("AdminBroadcastFormFields Component", () => {
  const defaultProps = {
    title: "Test Title",
    message: "Test Message",
    titleLimit: 50,
    messageLimit: 200,
    isSubmitting: false,
    onTitleChange: vi.fn(),
    onMessageChange: vi.fn(),
  };

  it("renders inputs with values and counts", () => {
    render(<AdminBroadcastFormFields {...defaultProps} />);

    expect(screen.getByLabelText("Title")).toHaveValue("Test Title");
    expect(screen.getByLabelText("Message")).toHaveValue("Test Message");
    expect(screen.getByText("10/50")).toBeDefined();
    expect(screen.getByText("12/200")).toBeDefined();
  });

  it("calls handlers on change", () => {
    const onTitleChange = vi.fn();
    const onMessageChange = vi.fn();
    render(
      <AdminBroadcastFormFields
        {...defaultProps}
        onTitleChange={onTitleChange}
        onMessageChange={onMessageChange}
      />
    );

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "New Title" } });
    expect(onTitleChange).toHaveBeenCalledWith("New Title");

    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "New Message" } });
    expect(onMessageChange).toHaveBeenCalledWith("New Message");
  });

  it("disables inputs when isSubmitting is true", () => {
    render(<AdminBroadcastFormFields {...defaultProps} isSubmitting={true} />);

    expect(screen.getByLabelText("Title")).toBeDisabled();
    expect(screen.getByLabelText("Message")).toBeDisabled();
  });
});
