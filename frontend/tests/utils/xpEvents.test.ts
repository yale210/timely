import { afterEach, describe, expect, it, vi } from "vitest";
import { emitXpGained, XP_GAINED_EVENT } from "@/utils/xpEvents";

describe("xpEvents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("exports the expected browser event name", () => {
    expect(XP_GAINED_EVENT).toBe("xp-gained");
  });

  it("dispatches a custom event with the XP amount", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    emitXpGained(25);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent<{ amount: number }>;
    expect(event.type).toBe(XP_GAINED_EVENT);
    expect(event.detail).toEqual({ amount: 25 });
  });

  it("returns early when window is unavailable", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    vi.stubGlobal("window", undefined);

    expect(() => emitXpGained(9)).not.toThrow();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
