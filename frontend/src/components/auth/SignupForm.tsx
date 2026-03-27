import { useState, type FormEvent, type ReactNode } from "react"
import { authService } from "@/services/authService"
import { useNavigate } from "react-router-dom"

interface SignupPayload {
  email: string
  password: string
  password2: string
  username: string
}

const PASSWORD_MISMATCH_ERROR = "Try again, your passwords did not match."
const SIGNUP_FAILED_ERROR = "Signup failed"

const buildSignupPayload = (
  email: string,
  username: string,
  password: string,
  confirmPassword: string,
): SignupPayload => ({
  email,
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
        buildSignupPayload(email, username, password, confirmPassword),
      )
      void navigate("/login")
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
      <div className="relative isolate flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
        { children }

        <div className="relative z-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <h2 className="mt-16 text-center text-2xl font-bold tracking-tight text-gray-900">
              Create your account
            </h2>
          </div>

          <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={signup} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 whitespace-pre-line">
                  {error}
                </div>
              )}

              {/* same fields */}
              <div>
                <label htmlFor="signup-username" className="block text-sm font-medium text-gray-900">Username</label>
                <div className="mt-2">
                  <input
                    id="signup-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600"
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
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600"
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
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600"
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
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div>
                <button
                  disabled={loading}
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60"
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
