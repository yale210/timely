import { useState, type FormEvent, type ReactNode } from "react"
import { authService } from "@/services/authService"
import { useNavigate } from "react-router-dom"
import LogoMark from "@/components/ui/LogoMark"
import { getStoredDefaultLandingPagePath } from "@/utils/userPreferences";

interface LoginFormProps {
    children?: ReactNode
}

/**
 * A functional component that renders the login page.
 * @param root0 - The component props.
 * @param root0.children - Optional child elements to render.
 * @returns The rendered login page component.
 */
export default function LoginForm({ children }: LoginFormProps ) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const login = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    void authService
      .login({ username, password })
      .then(() => {
        void navigate(getStoredDefaultLandingPagePath())
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Login failed"
        setError(message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
      <div className="relative isolate flex min-h-screen flex-col justify-start px-4 pb-12 pt-24 sm:justify-center sm:px-6 sm:py-12 lg:px-8">
        { children }

        <div className="relative z-10">
          <div className="mx-auto w-full max-w-sm text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100 sm:hidden">
              <LogoMark className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:mt-10">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Pick up where you left off and get back into your flow.
            </p>
          </div>

          <div className="mx-auto mt-6 w-full max-w-sm rounded-3xl border border-gray-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-sm sm:mt-10 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
            <form onSubmit={login} className="space-y-4 sm:space-y-6">
              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="login-username" className="block text-sm font-medium text-gray-900">Username</label>
                <div className="mt-2">
                  <input
                    id="login-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-900">Password</label>
                <div className="mt-2">
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <button
                  disabled={loading}
                  type="submit"
                  className="flex w-full justify-center rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  )
}
