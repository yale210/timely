import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LogoMark from "@/components/ui/LogoMark";

describe("LogoMark", () => {
  it("renders with the default className", () => {
    const { container } = render(<LogoMark />);
    const span = container.querySelector("span");

    expect(span).toBeInTheDocument();
    expect(span).toHaveAttribute("aria-hidden", "true");
    expect(span).toHaveClass("inline-block", "shrink-0", "bg-(--primary)", "h-6", "w-6");
  });

  it("renders with a custom className", () => {
    const { container } = render(<LogoMark className="h-10 w-10 custom-mark" />);
    const span = container.querySelector("span");

    expect(span).toHaveClass("h-10", "w-10", "custom-mark");
  });

  it("applies the expected mask styles", () => {
    const { container } = render(<LogoMark />);
    const span = container.querySelector("span") as HTMLSpanElement;

    expect(span.style.maskImage).toBe("url(\"/t.svg\")");
    expect(span.style.maskRepeat).toBe("no-repeat");
    expect(span.style.maskPosition).toBe("center");
    expect(span.style.maskSize).toBe("contain");

    expect(span.style.webkitMaskImage).toBe("url(\"/t.svg\")");
    expect(span.style.webkitMaskRepeat).toBe("no-repeat");
    expect(span.style.webkitMaskPosition).toBe("center");
    expect(span.style.webkitMaskSize).toBe("contain");
  });
});