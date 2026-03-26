import { describe, expect, it } from "vitest";
import { formatTime } from "@/utils/timeUtils";

describe("formatTime", () => {
  it("formats sub-hour values as MM:SS", () => {
    expect(formatTime(65)).toBe("01:05");
  });

  it("formats hour values as H:MM:SS", () => {
    expect(formatTime(3661)).toBe("1:01:01");
  });

  it("pads minutes and seconds with leading zeroes", () => {
    expect(formatTime(3605)).toBe("1:00:05");
  });
});
