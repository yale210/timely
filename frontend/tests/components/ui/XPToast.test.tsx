import { describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import XPToast from "@/components/ui/XPToast";
import { XP_GAINED_EVENT } from "@/utils/xpEvents";


describe("XPToast", () => {
  it("shows xp-gained messsage when xp gain up event is triggered after completing a task", async () => {
    render(<XPToast />);

    window.dispatchEvent(new CustomEvent(XP_GAINED_EVENT, { detail: { amount: 20 } }));

    expect(await screen.findByText("+20 XP")).toBeInTheDocument();
  });

  it("xp gained message dissappears after timeout", async () => {
    vi.useFakeTimers();
    render(<XPToast />);

    act(() => {
      window.dispatchEvent(new CustomEvent(XP_GAINED_EVENT, { detail: { amount: 30 } }));
    });

    const messageNode = screen.getByText("+30 XP");
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
