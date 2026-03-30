import { describe, expectTypeOf, it } from "vitest";
import type { AuthResponse, DeleteResponse, User } from "@/types/auth";

describe("auth types", () => {
  it("defines the authenticated user shape", () => {
    const user = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      is_staff: true,
      is_superuser: false,
    } satisfies User;

    expectTypeOf(user).toMatchTypeOf<User>();
  });

  it("defines the auth response shape", () => {
    const response = {
      token: "abc",
      key: "def",
      auth_token: "ghi",
      user: {
        id: 1,
        username: "testuser",
        email: "test@example.com",
      },
    } satisfies AuthResponse;

    expectTypeOf(response).toMatchTypeOf<AuthResponse>();
  });

  it("defines the delete response shape", () => {
    const response = {
      message: "Account deleted",
    } satisfies DeleteResponse;

    expectTypeOf(response).toMatchTypeOf<DeleteResponse>();
  });
});
