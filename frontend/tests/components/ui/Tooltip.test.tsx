import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Tooltip from "@/components/ui/Tooltip";

describe("Tooltip", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
  });

  it("shows and hides tooltip content on hover", async () => {
    render(
      <Tooltip content="Helpful text">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Trigger" }));

    expect(await screen.findByText("Helpful text")).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole("button", { name: "Trigger" }));

    await waitFor(() =>
      expect(screen.queryByText("Helpful text")).not.toBeInTheDocument(),
    );
  });
});
