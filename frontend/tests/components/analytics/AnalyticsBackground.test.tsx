import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AnalyticsBackground from "@/components/analytics/AnalyticsBackground";

describe("AnalyticsBackground", () => {
  it("renders the decorative background container", () => {
    const { container } = render(<AnalyticsBackground />);

    const background = container.querySelector('[aria-hidden="true"]');
    expect(background).toBeInTheDocument();
  });
});
