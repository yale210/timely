import type * as ReactRouterDom from "react-router-dom";
import type { User } from "@/types";
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCourseDetailConsts } from "@/hooks/course/useCourseDetailConsts";

const mockNavigate = vi.fn();
const mockUser: User = {
  id: 5,
  is_admin: true,
  username: "Asuka",
  email: "Kansai@kazama.com",
};

const { mockGetUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn<() => User | null>(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "12" }),
  };
});

vi.mock("@/services/authService", () => ({
  authStore: {
    getUser: (): User | null => mockGetUser(),
  },
}));

describe("useCourseDetailConsts", () => {
  it("returns route and auth constants", () => {
    mockGetUser.mockReturnValue(mockUser);

    const { result } = renderHook(() => useCourseDetailConsts());

    expect(result.current.id).toBe("12");
    expect(result.current.navigate).toBe(mockNavigate);
    expect(result.current.currentUser).toEqual({
        id: 5,
        is_admin: true,
        username: "Asuka",
        email: "Kansai@kazama.com",
    });
  });
});