import { afterEach, describe, expect, it, vi } from "vitest";
import { emitLevelup, LEVEL_UP_EVENT } from "@/utils/levelUpEvent";

describe("levelUpEvent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("exports the expected browser event name", () => {
    expect(LEVEL_UP_EVENT).toBe("level-up");
  });

  it("dispatches a custom event with the level amount", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    emitLevelup(12);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent<{ amount: number }>;
    expect(event.type).toBe(LEVEL_UP_EVENT);
    expect(event.detail).toEqual({ amount: 12 });
  });

  it("returns early when window is unavailable", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    vi.stubGlobal("window", undefined);

    expect(() => emitLevelup(7)).not.toThrow();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
