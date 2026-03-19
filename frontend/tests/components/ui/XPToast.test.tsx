import { describe, it, expect, vi } from "vitest"
import { render,screen } from "@testing-library/react"
import XPToast from "@/components/ui/XPToast"
import { XP_GAINED_EVENT } from "@/utils/xpEvents"


describe("XPToast", () => {
    it("shows xp-gained messsage when xp gain up event is triggered after completing a task", () => {
        render(<XPToast />);

        window.dispatchEvent(new CustomEvent(XP_GAINED_EVENT, {detail: {amount : 20}}));

        expect(screen.getByText("+20 XP")).toBeInTheDocument();
    });

    it("xp gained message dissappears after timeout", () => {
        vi.useFakeTimers()
        render(<XPToast />)

        window.dispatchEvent(new CustomEvent(XP_GAINED_EVENT, {detail : {amount : 30}}));
        
        expect(screen.getByText("+30 XP")).toBeInTheDocument();
        
        vi.advanceTimersByTime(2200);
        expect(screen.queryByText("+30 XP")).not.toBeInTheDocument();

        vi.useRealTimers();
    });
})