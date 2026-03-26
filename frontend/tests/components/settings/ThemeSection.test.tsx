import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ThemeSection from "@/components/settings/ThemeSection";

vi.mock("@/components", () => ({
  ThemeButton: ({
    title,
    themeChangeFunction,
  }: {
    title: string;
    themeChangeFunction: (themeName: string) => void;
  }) => (
    <button type="button" onClick={() => themeChangeFunction(title)}>
      {title === "dark" ? "Dark Surface" : title}
    </button>
  ),
  FontButton: ({
    title,
    fontChangeFunction,
  }: {
    title: string;
    fontChangeFunction: (fontName: string) => void;
  }) => (
    <button type="button" onClick={() => fontChangeFunction(title)}>
      {title === "poppins" ? "Font Ag Poppins" : title}
    </button>
  ),
}));

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
