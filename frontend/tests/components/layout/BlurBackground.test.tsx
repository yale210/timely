import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BlurBackground from "@/components/layout/BlurBackground";

describe("BlurBackground", () => {
  it("renders the decorative background container", () => {
    const { container } = render(<BlurBackground />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
