import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import GradebookLayout from "../../../src/components/gradebook/GradebookLayout";

describe("GradebookLayout", () => {
  it("renders children correctly", () => {
    render(
      <GradebookLayout>
        <div data-testid="child-element">Child Content</div>
      </GradebookLayout>
    );

    expect(screen.getByTestId("child-element")).toBeDefined();
    expect(screen.getByText("Child Content")).toBeDefined();
  });

  it("has correct layout classes", () => {
     const { container } = render(
      <GradebookLayout>
        <div>Content</div>
      </GradebookLayout>
    );
    
    const mainElement = container.querySelector('main');
    expect(mainElement).toBeDefined();
    expect(mainElement?.className).toContain("w-full");
    expect(mainElement?.className).toContain("px-6");
    expect(mainElement?.className).toContain("pt-2");
  });
});
