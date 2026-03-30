import { vi, describe, it, expect, beforeEach } from "vitest";
import { authStore, authService, AUTH_CHANGE_EVENT } from "@/services/authService";

// Mock api
const { mockDelete, mockPost } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  default: {
    delete: mockDelete,
    post: mockPost,
  },
}));

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("getToken returns null if no token", () => {
    expect(authStore.getToken()).toBeNull();
  });

  it("setToken sets token and broadcasts change", () => {
    const spy = vi.fn();
    window.addEventListener(AUTH_CHANGE_EVENT, spy);
    
    authStore.setToken("test-token");
    expect(localStorage.getItem("auth_token")).toBe("test-token");
    expect(spy).toHaveBeenCalled();
  });

  it("setUser sets user and broadcasts change", () => {
    const spy = vi.fn();
    window.addEventListener(AUTH_CHANGE_EVENT, spy);
    const user = { id: 1, username: "u", email: "e@e.com" };
    
    authStore.setUser(user);
    expect(JSON.parse(localStorage.getItem("auth_user")!)).toEqual(user);
    expect(spy).toHaveBeenCalled();
  });

  it("getUser returns parsed user if valid", () => {
    const user = { id: 1, username: "u", email: "e@e.com" };
    localStorage.setItem("auth_user", JSON.stringify(user));
    expect(authStore.getUser()).toEqual(user);
  });

  it("getUser returns null if invalid user object", () => {
    localStorage.setItem("auth_user", JSON.stringify({ name: "no email" }));
    expect(authStore.getUser()).toBeNull();
  });

  it("getUser returns null if malformed JSON", () => {
    localStorage.setItem("auth_user", "invalid {");
    expect(authStore.getUser()).toBeNull();
  });

  it("clear removes items and broadcasts", () => {
    localStorage.setItem("auth_token", "t");
    localStorage.setItem("auth_user", "{}");
    const spy = vi.fn();
    window.addEventListener(AUTH_CHANGE_EVENT, spy);

    authStore.clear();
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
    expect(spy).toHaveBeenCalled();
  });
});

describe("authService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("register calls correct URL and updates store", async () => {
    const payload = { username: "u", email: "e", password: "p", password2: "p", name: "User" };
    const mockResponse = { data: { token: "t", user: { username: "u", email: "e" } } };
    mockPost.mockResolvedValue(mockResponse);

    await authService.register(payload);

    expect(mockPost).toHaveBeenCalledWith("/api/authentication/register/", payload);
    expect(authStore.getToken()).toBe("t");
    expect(authStore.getUser()).toEqual(mockResponse.data.user);
  });

  it("login calls correct URL and updates store", async () => {
    const payload = { username: "u", password: "p" };
    const mockResponse = { data: { key: "k", user: { username: "u", email: "e" } } };
    mockPost.mockResolvedValue(mockResponse);

    await authService.login(payload);

    expect(mockPost).toHaveBeenCalledWith("/api/authentication/session/", payload);
    expect(authStore.getToken()).toBe("k");
  });

  it("login throws if no token returned", async () => {
    mockPost.mockResolvedValue({ data: {} });
    await expect(authService.login({ username: "u", password: "p" })).rejects.toThrow("Login succeeded but no token was returned.");
  });

  it("logout calls api and clears store", async () => {
    localStorage.setItem("auth_token", "t");
    mockPost.mockResolvedValue({});

    await authService.logout();

    expect(mockPost).toHaveBeenCalledWith("/api/authentication/logout/");
    expect(authStore.getToken()).toBeNull();
  });

  it("logout clears store even if api fails", async () => {
    localStorage.setItem("auth_token", "t");
    mockPost.mockRejectedValue(new Error("Fail"));

    await expect(authService.logout()).rejects.toThrow("Fail");

    expect(authStore.getToken()).toBeNull();
  });

  it("deleteAccount sends the password payload", async () => {
    mockDelete.mockResolvedValue({
      data: { message: "Account deleted successfully." },
    });

    await expect(authService.deleteAccount("secret")).resolves.toBe(
      "Account deleted successfully.",
    );

    expect(mockDelete).toHaveBeenCalledWith("/api/delete_account/", {
      data: { password: "secret" },
    });
  });
});
