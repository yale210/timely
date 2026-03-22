import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import type { Category } from "@/types";

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

import * as categoryService from "@/services/categoryService";

describe("categoryService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getCategories should call axios.get", async () => {
    const mockCategories: Category[] = [
      { id: 1, text: "Work", colour: "#00ff00", colour_override: true },
    ];
    const spy = vi.spyOn(axios, "get").mockResolvedValue({ data: mockCategories });

    const result = await categoryService.getCategories();

    expect(spy).toHaveBeenCalledWith("/api/categories/");
    expect(result).toEqual(mockCategories);
  });

  it("createCategory should call axios.post with the text payload", async () => {
    const mockCategory: Category = { id: 2, text: "Study" };
    const spy = vi.spyOn(axios, "post").mockResolvedValue({ data: mockCategory });

    const result = await categoryService.createCategory("Study");

    expect(spy).toHaveBeenCalledWith("/api/categories/", { text: "Study" });
    expect(result).toEqual(mockCategory);
  });

  it("updateCategory should call axios.patch with the category patch", async () => {
    const patch = { text: "Updated", colour: "#112233", colour_override: true };
    const mockCategory: Category = { id: 3, text: "Updated", colour: "#112233", colour_override: true };
    const spy = vi.spyOn(axios, "patch").mockResolvedValue({ data: mockCategory });

    const result = await categoryService.updateCategory(3, patch);

    expect(spy).toHaveBeenCalledWith("/api/categories/3/", patch);
    expect(result).toEqual(mockCategory);
  });

  it("deleteCategory should call axios.delete", async () => {
    const spy = vi.spyOn(axios, "delete").mockResolvedValue({});

    await categoryService.deleteCategory(4);

    expect(spy).toHaveBeenCalledWith("/api/categories/4/");
  });
});
