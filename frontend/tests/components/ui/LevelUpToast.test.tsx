import { describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import LevelUpToast from "@/components/ui/LevelUpToast";
import { LEVEL_UP_EVENT } from "@/utils/levelUpEvent";


describe("LevelUpToast", () => {
  it("shows level-up messsage when level up event is triggered", async () => {
    render(<LevelUpToast />);

    window.dispatchEvent(new CustomEvent(LEVEL_UP_EVENT, { detail: { amount: 5 } }));

    expect(await screen.findByText("Level Up! Level 5")).toBeInTheDocument();
  });

  it("level message dissappears after timeout", async () => {
    vi.useFakeTimers();
    render(<LevelUpToast />);

    act(() => {
      window.dispatchEvent(new CustomEvent(LEVEL_UP_EVENT, { detail: { amount: 2 } }));
    });

    const messageNode = screen.getByText("Level Up! Level 2");
    const toastNode = messageNode.parentElement;
    expect(messageNode).toBeInTheDocument();
    expect(toastNode).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(toastNode).toHaveClass("opacity-0");

    vi.useRealTimers();
  });
});
