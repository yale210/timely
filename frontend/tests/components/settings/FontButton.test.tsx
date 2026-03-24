import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FontButton from "@/components/settings/FontButton";

describe("FontButton", () => {
  it("calls the font change callback with its title", () => {
    const onChange = vi.fn();

    render(<FontButton title="poppins" fontChangeFunction={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Font Ag Poppins" }));

    expect(onChange).toHaveBeenCalledWith("poppins");
  });
});
