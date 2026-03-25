import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ThemeButton from "@/components/settings/ThemeButton";

describe("ThemeButton", () => {
  it("calls the theme change callback with its title", () => {
    const onChange = vi.fn();

    render(<ThemeButton title="dark" themeChangeFunction={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Dark Surface" }));

    expect(onChange).toHaveBeenCalledWith("dark");
  });
});
