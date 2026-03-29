import { useState, type FormEvent, type ReactNode } from "react"
import { authService } from "@/services/authService"
import { useNavigate } from "react-router-dom"
import LogoMark from "@/components/ui/LogoMark"

interface SignupPayload {
  email: string
  name: string
  password: string
  password2: string
  username: string
}

const PASSWORD_MISMATCH_ERROR = "Try again, your passwords did not match."
const SIGNUP_FAILED_ERROR = "Signup failed"

const buildSignupPayload = (
  name: string,
  email: string,
  username: string,
  password: string,
  confirmPassword: string,
): SignupPayload => ({
  email,
  name,
  password,
  password2: confirmPassword,
  username,
})

const getSignupErrorData = (error: unknown): Record<string, unknown> | null => {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return null
  }

  const response = (error as { response?: { data?: unknown } }).response
  const data = response?.data
  return data && typeof data === "object" ? (data as Record<string, unknown>) : null
}

const getSignupErrorLine = (field: string, value: unknown): string | null => {
  if (typeof value === "string") {
    return `${field}: ${value}`
  }

  if (!Array.isArray(value)) {
    return null
  }

  const joined = value
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ")
    .trim()

  return joined ? `${field}: ${joined}` : null
}

const getSignupErrorMessage = (error: unknown): string => {
  const data = getSignupErrorData(error)
  if (data) {
    const lines = Object.entries(data)
      .map(([field, value]) => getSignupErrorLine(field, value))
      .filter((line): line is string => Boolean(line))

    if (lines.length > 0) {
      return lines.join("\n")
    }
  }

  return error instanceof Error ? error.message : SIGNUP_FAILED_ERROR
}

/**
 * A functional component that renders the signup form.
 * @param root0 The props object.
 * @param root0.children Optional child elements to render.
 * @returns The rendered signup page component.
 */
export default function SignupForm({ children }: { children?: ReactNode }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const submitSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(PASSWORD_MISMATCH_ERROR)
      return
    }

    setLoading(true)

    try {
      await authService.register(
        buildSignupPayload(name, email, username, password, confirmPassword),
      )
      void navigate("/dashboard")
    } catch (err: unknown) {
      setError(getSignupErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const signup = (e: FormEvent<HTMLFormElement>) => {
    void submitSignup(e)
  }

  return (
      <div className="relative isolate flex min-h-screen flex-col justify-start px-4 pb-12 pt-24 sm:justify-center sm:px-6 sm:py-12 lg:px-8">
        { children }

        <div className="relative z-10">
          <div className="mx-auto w-full max-w-sm text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100 sm:hidden">
              <LogoMark className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:mt-16">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Set up your workspace and start planning with Timely.
            </p>
          </div>

          <div className="mx-auto mt-6 w-full max-w-sm rounded-3xl border border-gray-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-sm sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
            <form onSubmit={signup} className="space-y-4 sm:space-y-6">
              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 whitespace-pre-line">
                  {error}
                </div>
              )}

              {/* same fields */}
              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium text-gray-900">Name</label>
                <div className="mt-2">
                  <input
                    id="signup-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-username" className="block text-sm font-medium text-gray-900">Username</label>
                <div className="mt-2">
                  <input
                    id="signup-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-900">Email address</label>
                <div className="mt-2">
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-900">Password</label>
                <div className="mt-2">
                  <input
                    id="signup-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-password2" className="block text-sm font-medium text-gray-900">
                  Confirm password
                </label>
                <div className="mt-2">
                  <input
                    id="signup-password2"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <button
                  disabled={loading}
                  type="submit"
                  className="flex w-full justify-center rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 disabled:opacity-60"
                >
                  {loading ? "Signing up..." : "Sign up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  )
}
