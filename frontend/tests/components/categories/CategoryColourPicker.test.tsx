import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryColourPicker } from "@/components/categories/CategoryColourPicker";

vi.mock("react-colorful", () => ({
  HexColorPicker: ({ onChange }: { onChange: (value: string) => void }) => (
    <button type="button" onClick={() => onChange("#123456")}>
      Pick colour
    </button>
  ),
}));

describe("CategoryColourPicker", () => {
  it("renders the picker and forwards input actions", () => {
    const onColourInputChange = vi.fn();
    const onColourErrorChange = vi.fn();
    const onCommitInput = vi.fn();
    const onSelect = vi.fn();

    render(
      <CategoryColourPicker
        isOpen
        position={{ top: 20, left: 30 }}
        pickerRef={createRef<HTMLDivElement>()}
        colourInput="#ffffff"
        colourError={null}
        currentColour="#ffffff"
        onColourInputChange={onColourInputChange}
        onColourErrorChange={onColourErrorChange}
        onCommitInput={onCommitInput}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByText("Pick colour"));
    fireEvent.change(screen.getByPlaceholderText("Hex (#RRGGBB) or rgb(...)"), {
      target: { value: "#abcdef" },
    });
    fireEvent.keyDown(screen.getByPlaceholderText("Hex (#RRGGBB) or rgb(...)"), {
      key: "Enter",
    });
    fireEvent.click(screen.getByRole("button", { name: "Select" }));

    expect(onColourInputChange).toHaveBeenCalledWith("#123456");
    expect(onColourInputChange).toHaveBeenCalledWith("#abcdef");
    expect(onColourErrorChange).toHaveBeenCalledWith(null);
    expect(onCommitInput).toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalled();
  });
});
