import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryActionsMenu } from "@/components/categories/CategoryActionsMenu";

describe("CategoryActionsMenu", () => {
  it("renders in a portal and forwards action callbacks", () => {
    const onDelete = vi.fn();
    const onUpdate = vi.fn();
    const onClose = vi.fn();
    const onTogglePicker = vi.fn();

    render(
      <CategoryActionsMenu
        openMenuId={5}
        menuPosition={{ top: 10, left: 20 }}
        menuRef={createRef<HTMLDivElement>()}
        menuCategory={{ id: 5, text: "Work", colour_override: false }}
        presetColours={["#ff0000", "#00ff00"]}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onClose={onClose}
        onTogglePicker={onTogglePicker}
      />,
    );

    fireEvent.click(screen.getByText("Delete").closest("button")!);
    fireEvent.click(screen.getByLabelText("Set colour #ff0000"));
    fireEvent.click(screen.getByLabelText("Custom colour"));
    fireEvent.click(screen.getByRole("checkbox"));

    expect(onDelete).toHaveBeenCalledWith(5);
    expect(onClose).toHaveBeenCalled();
    expect(onUpdate).toHaveBeenCalledWith(5, { colour: "#ff0000" });
    expect(onUpdate).toHaveBeenCalledWith(5, { colour_override: true });
    expect(onTogglePicker).toHaveBeenCalled();
  });
});
