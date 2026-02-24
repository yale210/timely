import { describe, it, expect, vi, beforeEach } from "vitest";

// Unmock before importing dependencies that might be mocked globally
vi.unmock("@/services/authService");

import api from "@/services/api";
import { authService, authStore } from "@/services/authService";

vi.mock("@/services/api", () => ({
    default: {
        post: vi.fn(),
        get: vi.fn(),
        interceptors: {
            request: { use: vi.fn(), eject: vi.fn() },
            response: { use: vi.fn(), eject: vi.fn() },
        },
    },
}));

describe("authStore", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it("gets and sets token", () => {
        const spy = vi.spyOn(authStore, "setToken");
        authStore.setToken("test-token");
        expect(authStore.getToken()).toBe("test-token");
        expect(localStorage.getItem("auth_token")).toBe("test-token");
        expect(vi.mocked(spy)).toHaveBeenCalled();
    });

    it("gets and sets user", () => {
        const user = { username: "tp", email: "tp@example.com", id: 1 };
        authStore.setUser(user);
        expect(authStore.getUser()).toEqual(user);
        expect(localStorage.getItem("auth_user")).toBe(JSON.stringify(user));
    });

    it("returns null for invalid user JSON", () => {
        localStorage.setItem("auth_user", "invalid");
        expect(authStore.getUser()).toBeNull();
    });

    it("returns null for user JSON lacking username", () => {
        localStorage.setItem("auth_user", JSON.stringify({ email: "x@x.com" }));
        expect(authStore.getUser()).toBeNull();
    });

    it("clears storage", () => {
        authStore.setToken("t");
        authStore.setUser({ username: "u", email: "e@e.com" });
        authStore.clear();
        expect(authStore.getToken()).toBeNull();
        expect(authStore.getUser()).toBeNull();
    });
});

describe("authService", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it("successfully registers", async () => {
        const payload = { username: "u", email: "e@m.com", password: "p", password2: "p" };
        const responseData = { token: "token123", user: { username: "u", email: "e@m.com", id: 1 } };
        const spy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: responseData });

        const result = await authService.register(payload);

        expect(spy).toHaveBeenCalledWith("/api/authentication/register/", payload);
        expect(authStore.getToken()).toBe("token123");
        expect(result).toEqual(responseData);
    });

    it("successfully logins", async () => {
        const payload = { username: "u", password: "p" };
        const responseData = { token: "token456", user: { username: "u", email: "e@m.com", id: 2 } };
        const spy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: responseData });

        const result = await authService.login(payload);

        expect(spy).toHaveBeenCalledWith("/api/authentication/session/", payload);
        expect(authStore.getToken()).toBe("token456");
        expect(result).toEqual(responseData);
    });

    it("throws error if login returns no token", async () => {
        vi.spyOn(api, "post").mockResolvedValueOnce({ data: { user: {} } });
        await expect(authService.login({ username: "u", password: "p" }))
            .rejects.toThrow("Login succeeded but no token was returned.");
    });

    it("successfully logouts and clears store", async () => {
        authStore.setToken("t");
        const spy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: {} });

        await authService.logout();

        expect(spy).toHaveBeenCalledWith("/api/authentication/logout/");
        expect(authStore.getToken()).toBeNull();
    });

    it("clears store even if logout API fails", async () => {
        authStore.setToken("t");
        vi.spyOn(api, "post").mockRejectedValueOnce(new Error("Logout error"));
        
        try {
            await authService.logout();
        } catch {
            // expected
        }
        
        expect(authStore.getToken()).toBeNull();
    });
});

