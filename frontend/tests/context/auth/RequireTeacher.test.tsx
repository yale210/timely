import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RequireTeacher from "@/context/auth/RequireTeacher";
import { useTeacher } from "@/hooks/course/useTeacher";
import { authStore } from "@/services/authService";

vi.mock("@/hooks/course/useTeacher", () => ({
  useTeacher: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
  };
});

const mockedUseTeacher = vi.mocked(useTeacher);

describe("RequireTeacher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing while loading", () => {
    mockedUseTeacher.mockReturnValue({
      teacher: null,
      isTeacher: false,
      loading: true,
      error: null,
    });

    vi.spyOn(authStore, "getUser").mockReturnValue(null);

    const { container } = render(
      <MemoryRouter>
        <RequireTeacher>
          <div>Protected content</div>
        </RequireTeacher>
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("redirects non-teachers who are not superusers", () => {
    mockedUseTeacher.mockReturnValue({
      teacher: null,
      isTeacher: false,
      loading: false,
      error: null,
    });

    vi.spyOn(authStore, "getUser").mockReturnValue({
      id: 1,
      username: "user",
      email: "user@example.com",
      is_superuser: false,
    } as never);

    render(
      <MemoryRouter>
        <RequireTeacher>
          <div>Protected content</div>
        </RequireTeacher>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("navigate")).toHaveTextContent("/courses");
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("redirects when there is no current user and isTeacher is false", () => {
    mockedUseTeacher.mockReturnValue({
      teacher: null,
      isTeacher: false,
      loading: false,
      error: null,
    });

    vi.spyOn(authStore, "getUser").mockReturnValue(null);

    render(
      <MemoryRouter>
        <RequireTeacher>
          <div>Protected content</div>
        </RequireTeacher>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("navigate")).toHaveTextContent("/courses");
  });

  it("renders children when the user is a teacher", () => {
    mockedUseTeacher.mockReturnValue({
      teacher: { id: 1 } as never,
      isTeacher: true,
      loading: false,
      error: null,
    });

    vi.spyOn(authStore, "getUser").mockReturnValue({
      id: 1,
      username: "teacher",
      email: "teacher@example.com",
      is_superuser: false,
    } as never);

    render(
      <MemoryRouter>
        <RequireTeacher>
          <div>Protected content</div>
        </RequireTeacher>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });

  it("renders children when the user is a superuser even if not a teacher", () => {
    mockedUseTeacher.mockReturnValue({
      teacher: null,
      isTeacher: false,
      loading: false,
      error: null,
    });

    vi.spyOn(authStore, "getUser").mockReturnValue({
      id: 1,
      username: "admin",
      email: "admin@example.com",
      is_superuser: true,
    } as never);

    render(
      <MemoryRouter>
        <RequireTeacher>
          <div>Protected content</div>
        </RequireTeacher>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });
});