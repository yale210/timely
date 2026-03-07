import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NotificationDetailBody } from "@/components/notifications/NotificationDetailBody";

describe("NotificationDetailBody Component", () => {
  it("renders the notification message correctly", () => {
    const testMessage = "Hello World";
    render(<NotificationDetailBody message={testMessage} />);
    
    expect(screen.getByText(testMessage)).toBeDefined();
  });

  it("applies whitespace-pre-wrap class", () => {
    const testMessage = "Multi\nLine\nMessage";
    render(<NotificationDetailBody message={testMessage} />);
    
    const element = screen.getByText(/Multi/);
    expect(element.className).toContain("whitespace-pre-wrap");
  });
});
