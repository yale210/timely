import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ThemeSection from "@/components/settings/ThemeSection";

describe("ThemeSection", () => {
  it("renders theme buttons and forwards theme selections", () => {
    const onThemeChange = vi.fn();
    const onFontChange = vi.fn();

    render(
      <ThemeSection
        onThemeChange={onThemeChange}
        onFontChange={onFontChange}
        mode="themes"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Dark Surface" }));

    expect(onThemeChange).toHaveBeenCalledWith("dark");
    expect(onFontChange).not.toHaveBeenCalled();
  });

  it("renders font buttons and forwards font selections", () => {
    const onThemeChange = vi.fn();
    const onFontChange = vi.fn();

    render(
      <ThemeSection
        onThemeChange={onThemeChange}
        onFontChange={onFontChange}
        mode="fonts"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Font Ag Poppins" }));

    expect(onFontChange).toHaveBeenCalledWith("poppins");
    expect(onThemeChange).not.toHaveBeenCalled();
  });
});
