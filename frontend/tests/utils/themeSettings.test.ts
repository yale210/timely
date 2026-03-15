import { beforeEach, describe, expect, it } from "vitest";
import { applyFont, applyTheme } from "@/utils/themeSettings";

describe("themeSettings utilities", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.font;
  });

  it("applies and persists the selected theme", () => {
    applyTheme("ocean");

    expect(document.documentElement.dataset.theme).toBe("ocean");
    expect(localStorage.getItem("theme")).toBe("ocean");
  });

  it("applies and persists the selected font", () => {
    applyFont("open-dyslexic");

    expect(document.documentElement.dataset.font).toBe("open-dyslexic");
    expect(localStorage.getItem("font")).toBe("open-dyslexic");
  });
});
