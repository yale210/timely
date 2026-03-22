import { afterEach, describe, expect, it, vi } from "vitest";
import { getPastWeeks } from "@/utils/dateUtils";

describe("getPastWeeks", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the requested number of week options starting from the current ISO week", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-18T12:00:00.000Z"));

    const weeks = getPastWeeks(3);

    expect(weeks).toEqual([
      { label: "Week of 16 Mar 2026", value: "2026-03-16" },
      { label: "Week of 9 Mar 2026", value: "2026-03-09" },
      { label: "Week of 2 Mar 2026", value: "2026-03-02" },
    ]);
  });

  it("uses 12 weeks by default", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-18T12:00:00.000Z"));

    expect(getPastWeeks()).toHaveLength(12);
  });
});
