import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminHistoryDetailPayload } from "@/components/admin/notifications";

describe("AdminHistoryDetailPayload Component", () => {
  it("renders the message payload correctly", () => {
    const testMessage = "This is a test broadcast message.";
    render(<AdminHistoryDetailPayload message={testMessage} />);
    
    expect(screen.getByText("Payload")).toBeDefined();
    expect(screen.getByText(testMessage)).toBeDefined();
  });

  it("handles whitespace in message payload", () => {
    const testMessageWithWhitespace = "Line 1\nLine 2\n  Indented Line";
    render(<AdminHistoryDetailPayload message={testMessageWithWhitespace} />);
    
    const messageElement = screen.getByText((content) => content.includes("Line 1") && content.includes("Line 2"));
    expect(messageElement).toBeDefined();
    expect(messageElement.className).toContain("whitespace-pre-wrap");
  });
});
