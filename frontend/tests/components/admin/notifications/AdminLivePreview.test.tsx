import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminLivePreview } from "@/components/admin/notifications/AdminLivePreview";

describe("AdminLivePreview Component", () => {
  it("renders default preview text when title and message are empty", () => {
    render(<AdminLivePreview title="" message="" />);
    expect(screen.getByText("Notification title preview")).toBeDefined();
    expect(screen.getByText("Notification body preview will appear here.")).toBeDefined();
  });

  it("renders provided title and message", () => {
    render(<AdminLivePreview title="Custom Title" message="Custom Message" />);
    const card = screen.getByText("Custom Title");
    expect(card).toBeDefined();
    expect(screen.getByText("Custom Message")).toBeDefined();
    
    // Trigger onClick callback
    fireEvent.click(card);
  });
});
