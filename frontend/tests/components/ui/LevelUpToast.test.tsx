import { describe, it, expect, vi } from "vitest"
import { render,screen } from "@testing-library/react"
import LevelUpToast from "@/components/ui/LevelUpToast"
import { LEVEL_UP_EVENT } from "@/utils/levelUpEvent"


describe("LevelUpToast", () => {
    it("shows level-up messsage when level up event is triggered", () => {
        render(<LevelUpToast />);

        window.dispatchEvent(new CustomEvent(LEVEL_UP_EVENT, {detail: {amount : 5}}));

        expect(screen.getByText("Level Up ! Level 5")).toBeInTheDocument();
    });

    it("level message dissappears after timeout", () => {
        vi.useFakeTimers()
        render(<LevelUpToast />)

        window.dispatchEvent(new CustomEvent(LEVEL_UP_EVENT, {detail : {amount : 2}}));
        
        expect(screen.getByText("Level Up ! Level 2")).toBeInTheDocument();
        
        vi.advanceTimersByTime(2200);
        expect(screen.queryByText("Level Up! Level 2")).not.toBeInTheDocument();

        vi.useRealTimers();
    });
})