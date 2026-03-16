import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ThemesPageContent from "@/components/settings/ThemesPageContent";

vi.mock("@/components/index.ts", () => ({
  AppNavbar: () => <div data-testid="app-navbar" />,
  ThemeButton: ({
    title,
    themeChangeFunction,
  }: {
    title: string;
    themeChangeFunction: (value: string) => void;
  }) => (
    <button type="button" onClick={() => themeChangeFunction(title)}>
      theme:{title}
    </button>
  ),
  FontButton: ({
    title,
    fontChangeFunction,
  }: {
    title: string;
    fontChangeFunction: (value: string) => void;
  }) => (
    <button type="button" onClick={() => fontChangeFunction(title)}>
      font:{title}
    </button>
  ),
}));

describe("ThemesPageContent", () => {
  it("renders options and forwards theme and font selections", () => {
    const onThemeChange = vi.fn();
    const onFontChange = vi.fn();

    render(
      <ThemesPageContent
        themeOptions={["dark", "light"]}
        fontOptions={["poppins", "pacifico"]}
        onThemeChange={onThemeChange}
        onFontChange={onFontChange}
      />,
    );

    expect(screen.getByTestId("app-navbar")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "theme:dark" }));
    fireEvent.click(screen.getByRole("button", { name: "font:poppins" }));

    expect(onThemeChange).toHaveBeenCalledWith("dark");
    expect(onFontChange).toHaveBeenCalledWith("poppins");
  });
});
