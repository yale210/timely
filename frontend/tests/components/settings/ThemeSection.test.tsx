import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ThemeSection from "@/components/settings/ThemeSection";

describe("ThemeSection", () => {
  it("renders theme and font buttons and forwards selections", () => {
    const onThemeChange = vi.fn();
    const onFontChange = vi.fn();

    render(
      <ThemeSection
        onThemeChange={onThemeChange}
        onFontChange={onFontChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Dark Surface" }));
    fireEvent.click(screen.getByRole("button", { name: "Font Ag Poppins" }));

    expect(onThemeChange).toHaveBeenCalledWith("dark");
    expect(onFontChange).toHaveBeenCalledWith("poppins");
  });
});
