import { useState, type FormEvent, type ReactNode } from "react"
import { BlurBackground } from "@/components/index"
import { authService } from "@/services/authService"
import { useNavigate } from "react-router-dom"

interface LoginFormProps {
    children?: ReactNode
}

/**
 * A functional component that renders the login page.
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
        void navigate("/dashboard")
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
      <div className="relative isolate flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
        { children }

        <div className="relative z-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
              Sign in to your account
            </h2>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={login} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
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
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 outline outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600"
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
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 outline outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div>
                <button
                  disabled={loading}
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
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


