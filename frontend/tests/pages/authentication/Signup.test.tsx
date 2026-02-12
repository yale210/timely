import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Signup from "@/pages/Authentication/Signup"
import { authService } from "@/services/authService"
import "@testing-library/jest-dom/vitest"

vi.mock("@/services/authService", () => ({
  authService: {
    register: vi.fn(),
  },
}))

vi.mock("@/components/index", () => ({
  Navbar: () => <div data-testid="navbar" />,
  Footer: () => <div data-testid="footer" />,
}))

describe("Signup page", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("submits details and navigates to login on success", async () => {
    const registerSpy = vi.spyOn(authService, "register").mockResolvedValue({} as never)

    const { container } = render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "alice" } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "alice@example.com" } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret" } })
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }))

    await waitFor(() =>
      expect(registerSpy).toHaveBeenCalledWith({
        username: "alice",
        email: "alice@example.com",
        password: "secret",
      })
    )
    expect(container.querySelector(".bg-red-50")).toBeNull()
  })

  it("shows error when signup fails", async () => {
    const registerSpy = vi.spyOn(authService, "register").mockRejectedValue(new Error("Signup failed"))

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "bob" } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "bob@example.com" } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "pass" } })
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }))

    expect(await screen.findByText("Signup failed")).toBeInTheDocument()
    expect(registerSpy).toHaveBeenCalled()
  })

  it("disables submit and shows loading text while signing up", async () => {
    let resolveFn: (() => void) | undefined
    const deferred = new Promise((resolve) => {
      resolveFn = () => resolve({} as never)
    })
    const registerSpy = vi.spyOn(authService, "register").mockReturnValue(deferred as never)

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "carol" } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "carol@example.com" } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "pw" } })

    const button = screen.getByRole("button", { name: /sign up/i })
    fireEvent.click(button)

    expect(button).toBeDisabled()
    expect(button).toHaveTextContent(/signing up/i)

    resolveFn?.()

    await waitFor(() => expect(registerSpy).toHaveBeenCalled())
  })
})
