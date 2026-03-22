import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Login from "@/pages/Authentication/Login"
import type * as ComponentsIndexModule from "@/components/index"
import { authService } from "@/services/authService"
import "@testing-library/jest-dom/vitest"

vi.mock("@/services/authService", () => ({
  authService: {
    login: vi.fn(),
  },
}))

vi.mock("@/components/index", async (importOriginal) => {
  const actual = await importOriginal<typeof ComponentsIndexModule>()
  return {
    ...actual,
    HomeNavbar: () => <div data-testid="navbar" />,
    BlurBackground: () => <div data-testid="blur-bg" />,
    Footer: () => <div data-testid="footer" />,
  }
})

describe("Login page", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("submits credentials and navigates on success", async () => {
    const loginSpy = vi.spyOn(authService, "login").mockResolvedValue({} as never)

    const { container } = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "alice" } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret" } })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() =>
      expect(loginSpy).toHaveBeenCalledWith({ username: "alice", password: "secret" })
    )
    expect(container.querySelector(".bg-red-50")).toBeNull()
  })

  it("shows error when login fails", async () => {
    const loginSpy = vi.spyOn(authService, "login").mockRejectedValue(new Error("Bad creds"))

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "bob" } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    expect(await screen.findByText("Bad creds")).toBeInTheDocument()
    expect(loginSpy).toHaveBeenCalled()
  })

  it("disables submit and shows loading text while logging in", async () => {
    let resolveFn: (() => void) | undefined
    const deferred = new Promise((resolve) => {
      resolveFn = () => resolve({} as never)
    })
    const loginSpy = vi.spyOn(authService, "login").mockReturnValue(deferred as never)

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "alice" } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret" } })

    const button = screen.getByRole("button", { name: /sign in/i })
    fireEvent.click(button)

    expect(button).toBeDisabled()
    expect(button).toHaveTextContent(/signing in/i)

    resolveFn?.()

    await waitFor(() => expect(loginSpy).toHaveBeenCalled())
  })
})
