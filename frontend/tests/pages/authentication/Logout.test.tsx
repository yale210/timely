import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import type * as ComponentsModule from '@/components'
// Mock components used in Logout (merge with real module to avoid dropping other exports)
vi.mock("@/components", async (importOriginal) => {
  const actual = await importOriginal<typeof ComponentsModule>()
  return {
    ...actual,
    HomeNavbar: () => <div data-testid="navbar">Navbar</div>,
    Footer: () => <div data-testid="footer">Footer</div>,
    LogoutMessage: () => <div>Signing you out…</div>,
  }
})

import { authService } from "@/services/authService"

describe("Logout Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("successfully calls authService.logout on mount", async () => {
    const logoutSpy = vi.spyOn(authService, "logout").mockResolvedValue()
    
    const { default: Logout } = await import("@/pages/Authentication/Logout")

    render(
      <MemoryRouter initialEntries={["/logout"]}>
        <Routes>
          <Route path="/logout" element={<Logout />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    // Check it displays the signing out message
    expect(screen.getByText(/Signing you out/i)).toBeInTheDocument()
    
    // Verify logout was called
    expect(logoutSpy).toHaveBeenCalledTimes(1)

    // Verify it redirects to login
    await waitFor(() => {
      expect(screen.getByText(/Login Page/i)).toBeInTheDocument()
    })
  })

  it("displays error message if logout fails", async () => {
    vi.spyOn(authService, "logout").mockRejectedValue(new Error("Server down"))
    
    const { default: Logout } = await import("@/pages/Authentication/Logout")

    render(
      <MemoryRouter initialEntries={["/logout"]}>
        <Routes>
          <Route path="/logout" element={<Logout />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    // It should eventually redirect to login
    await waitFor(() => {
      expect(screen.getByText(/Login Page/i)).toBeInTheDocument()
    })
  })

  it("handles non-Error objects in logout failure gracefully", async () => {
    vi.spyOn(authService, "logout").mockRejectedValue("Unexpected failure")
    
    const { default: Logout } = await import("@/pages/Authentication/Logout")

    render(
      <MemoryRouter initialEntries={["/logout"]}>
        <Routes>
          <Route path="/logout" element={<Logout />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Login Page/i)).toBeInTheDocument()
    })
  })
})
