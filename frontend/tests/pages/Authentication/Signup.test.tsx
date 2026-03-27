import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Signup from "@/pages/Authentication/Signup"
import type * as ComponentsIndexModule from "@/components/index"
import { authService } from "@/services/authService"
import "@testing-library/jest-dom/vitest"
import type * as ReactRouterDom from "react-router-dom"

const navigateMock = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual: typeof ReactRouterDom = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock("@/services/authService", () => ({
  authService: {
    register: vi.fn(),
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

describe("Signup page", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    navigateMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function fillForm() {
    fireEvent.change(screen.getByLabelText(/^name$/i), {
      target: { value: "Alice Example" },
    })
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "alice" },
    })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "alice@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Secret123" },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "Secret123" },
    })
  }

  it("submits details and navigates to the dashboard on success", async () => {
    const registerSpy = vi
      .spyOn(authService, "register")
      .mockResolvedValue({} as never)

    const { container } = render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fillForm()
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }))

    await waitFor(() =>
      expect(registerSpy).toHaveBeenCalledWith({
        name: "Alice Example",
        username: "alice",
        email: "alice@example.com",
        password: "Secret123",
        password2: "Secret123",
      })
    )
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/dashboard")
    })
    expect(container.querySelector(".bg-red-50")).toBeNull()
  })

  it("shows error when signup fails", async () => {
    const registerSpy = vi.spyOn(authService, "register").mockRejectedValue(
      new Error("Signup failed")
    )

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Bob Example" } })
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "bob" } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "bob@example.com" } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "pass" } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "pass" } })
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }))

    expect(await screen.findByText("Signup failed")).toBeInTheDocument()
    expect(registerSpy).toHaveBeenCalled()
  })

  it("disables submit and shows loading text while signing up", async () => {
    let resolveFn: (() => void) | undefined
    const deferred = new Promise((resolve) => {
      resolveFn = () => resolve({} as never)
    })
    const registerSpy = vi
    .spyOn(authService, "register")
    .mockReturnValue(deferred as never)

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Carol Example" } })
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "carol" } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "carol@example.com" } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "pw" } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "pw" } })

    const button = screen.getByRole("button", { name: /sign up/i })
    fireEvent.click(button)

    expect(button).toBeDisabled()
    expect(button).toHaveTextContent(/signing up/i)

    resolveFn?.()

    await waitFor(() => expect(registerSpy).toHaveBeenCalled())
  })
})
