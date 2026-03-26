import { describe, expect, it } from "vitest";
import {
  convertHHMMToMinutes,
  convertMinutesToHHMM,
  parseAndValidateHHMM,
} from "@/utils/timeFormatters";

describe("timeFormatters", () => {
  it("converts total minutes into hours and minutes", () => {
    expect(convertMinutesToHHMM(135)).toEqual({ hours: 2, minutes: 15 });
  });

  it("converts hours and minutes into a single minute total", () => {
    expect(convertHHMMToMinutes(2, 15)).toBe(135);
  });

  it("normalizes minute overflow before validating", () => {
    expect(parseAndValidateHHMM("1", "90")).toBe(150);
  });

  it("enforces the one-minute minimum", () => {
    expect(parseAndValidateHHMM("0", "0")).toBe(1);
    expect(parseAndValidateHHMM("bad", "input")).toBe(1);
  });

  it("caps values at ten hours", () => {
    expect(parseAndValidateHHMM("12", "30")).toBe(600);
  });
});
