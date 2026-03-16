import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import type { SpecialDate } from "@/types";

vi.mock("axios", () => {
  const mockAxios = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: {},
  } satisfies {
    get: ReturnType<typeof vi.fn>
    post: ReturnType<typeof vi.fn>
    patch: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    interceptors: {
      request: { use: ReturnType<typeof vi.fn> }
      response: { use: ReturnType<typeof vi.fn> }
    }
    defaults: Record<string, unknown>
  };

  mockAxios.create.mockReturnValue(mockAxios);
  return { default: mockAxios };
});

import * as specialDatesService from "@/services/specialDatesService";

describe("specialDatesService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getSpecialDates should call axios.get", async () => {
    const mockSpecialDates: SpecialDate[] = [
      { id: 1, date: "2026-12-25", text: "Holiday" },
    ];
    const spy = vi.spyOn(axios, "get").mockResolvedValue({ data: mockSpecialDates });

    const result = await specialDatesService.getSpecialDates();

    expect(spy).toHaveBeenCalledWith("/api/special-dates/");
    expect(result).toEqual(mockSpecialDates);
  });

  it("createSpecialDate should call axios.post with the payload", async () => {
    const payload = { date: "2026-12-25", text: "Holiday" };
    const mockSpecialDate: SpecialDate = { id: 2, ...payload };
    const spy = vi.spyOn(axios, "post").mockResolvedValue({ data: mockSpecialDate });

    const result = await specialDatesService.createSpecialDate(payload);

    expect(spy).toHaveBeenCalledWith("/api/special-dates/", payload);
    expect(result).toEqual(mockSpecialDate);
  });

  it("deleteSpecialDate should call axios.delete", async () => {
    const spy = vi.spyOn(axios, "delete").mockResolvedValue({});

    await specialDatesService.deleteSpecialDate(3);

    expect(spy).toHaveBeenCalledWith("/api/special-dates/3/");
  });
});
