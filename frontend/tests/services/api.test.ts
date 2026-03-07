import { describe, it, expect, vi, beforeEach } from "vitest";
import api from "@/services/api";
import { authStore } from "@/services/authService";
import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

vi.mock("@/services/authService", () => ({
  authStore: {
    getToken: vi.fn(),
  },
}));

describe("api service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("adds Authorization header if token exists and headers is AxiosHeaders", async () => {
    vi.spyOn(authStore, 'getToken').mockReturnValue("mock-token");
    
    const mockAdapter = vi.fn().mockResolvedValue({ data: {}, status: 200, statusText: "OK", headers: {}, config: {} });
    api.defaults.adapter = mockAdapter;

    await api.get("/test", {
        headers: new AxiosHeaders({ "X-Test": "test" })
    });

    expect(mockAdapter).toHaveBeenCalled();
    const call = mockAdapter.mock.calls[0][0] as InternalAxiosRequestConfig;
    expect(call.headers.get("Authorization")).toBe("Token mock-token");
  });

  it("adds Authorization header and creates AxiosHeaders if plain object (manual check)", () => {
    vi.spyOn(authStore, 'getToken').mockReturnValue("mock-token");
    
    // Find the interceptor
    // @ts-expect-error - accessing internal interceptor handlers for testing
    const interceptor = api.interceptors.request.handlers[0].fulfilled as (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
    
    const config = {
        headers: { "X-Plain": "object" }
    } as unknown as InternalAxiosRequestConfig;
    
    const result = interceptor(config);
    
    expect(result.headers).toBeInstanceOf(AxiosHeaders);
    expect(result.headers.get("Authorization")).toBe("Token mock-token");
  });

  it("handles case where headers is already AxiosHeaders (manual check)", () => {
    vi.spyOn(authStore, 'getToken').mockReturnValue("mock-token");
    
    // @ts-expect-error - accessing internal interceptor handlers for testing
    const interceptor = api.interceptors.request.handlers[0].fulfilled as (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
    
    const headers = new AxiosHeaders();
    const config = { headers } as unknown as InternalAxiosRequestConfig;
    
    const result = interceptor(config);
    
    expect(result.headers).toBe(headers);
    expect(result.headers.get("Authorization")).toBe("Token mock-token");
  });

  it("does not add Authorization header if token does not exist", async () => {
    vi.spyOn(authStore, 'getToken').mockReturnValue(null);
    
    const mockAdapter = vi.fn().mockResolvedValue({ data: {}, status: 200, statusText: "OK", headers: {}, config: {} });
    api.defaults.adapter = mockAdapter;

    await api.get("/test");

    expect(mockAdapter).toHaveBeenCalled();
    const call = mockAdapter.mock.calls[0][0] as InternalAxiosRequestConfig;
    expect(call.headers.get("Authorization")).toBeUndefined();
  });
});
