import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import XPBar from "@/components/ui/XPBar";

describe("XPBar", () => {

  it("renders xp progress bar", () => {
    render(<XPBar xp={0} level={1} />);

    const progressEl = screen.getByTestId("xp-bar-fill");
    expect(progressEl.style.getPropertyValue("--xp-progress")).toMatch(/0/);
  });

  it("renders xp progress bar", () => {
    render(<XPBar xp={100} level={1} />);

    const progressEl = screen.getByTestId("xp-bar-fill");
    expect(progressEl.style.getPropertyValue("--xp-progress")).toMatch(/35/);
  });

  it("renders xp progress bar", () => {
    render(<XPBar xp={280} level={1} />);

    const progressEl = screen.getByTestId("xp-bar-fill");
    expect(progressEl.style.getPropertyValue("--xp-progress")).toMatch(/99/);
  });
});
