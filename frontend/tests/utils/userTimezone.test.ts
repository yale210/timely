import { beforeEach, describe, expect, it } from "vitest";
import {
  USER_TIMEZONE_STORAGE_KEY,
  getStoredUserTimezone,
  setStoredUserTimezone,
} from "@/utils/userTimezone";

describe("userTimezone", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("drops an invalid stored timezone and falls back to a valid one", () => {
    localStorage.setItem(USER_TIMEZONE_STORAGE_KEY, "not-a-real-zone");

    const timezone = getStoredUserTimezone();

    expect(timezone).not.toBe("not-a-real-zone");
    expect(localStorage.getItem(USER_TIMEZONE_STORAGE_KEY)).toBeNull();
  });

  it("refuses to persist an invalid timezone value", () => {
    setStoredUserTimezone("not-a-real-zone");

    const stored = localStorage.getItem(USER_TIMEZONE_STORAGE_KEY);

    expect(stored).not.toBe("not-a-real-zone");
    expect(stored).toBeTruthy();
  });
});
