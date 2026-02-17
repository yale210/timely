import { useState, type FormEvent } from "react"
import { HomeNavbar, Footer } from "@/components/index"
import { authService } from "@/services/authService"
import { useNavigate } from "react-router-dom"

/**
 * A functional component that renders the signup page.
 * @returns The rendered signup page component.
 */
export default function Signup() {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const signup = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password!=confirmPassword){
      setError("Try again, your passwords did not match.")
      setLoading(false)
      return
    }

    void authService
      .register({
        username,
        email,
        password,
        password2: confirmPassword,
      })
      .then(() => {
        void navigate("/login")
      })
      .catch((err: unknown) => {
        let message = "Signup failed";
        if (typeof err === "object" && err !== null && "response" in err) {
          const maybeAxios = err as {
            response?: {
              data?: unknown
            }
          }
          const data = maybeAxios.response?.data
          if (data && typeof data === "object"){
            const obj= data as Record<string, unknown>;
            const lines: string[] = []

            for (const [field, value] of Object.entries(obj)) {
              if (Array.isArray(value)) {
                const joined = value.filter((v) => typeof v === "string").join(" ")
                if (joined) {
                  lines.push(`${field}: ${joined}`)
                }
              } else if (typeof value === "string"){
                lines.push(`${field}: ${value}`)
              }
            }

            if (lines.length>0) {
              message=lines.join("\n")
            }
          }
        } else if (err instanceof Error){
          message = err.message
        }
        //message = err instanceof Error ? err.message : "Signup failed"
        setError(message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div className="bg-white">
      <HomeNavbar />
      <div className="relative isolate flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
        {/* same background blob */}
        <div aria-hidden="true" className="absolute inset-x-0 -top-40 z-0 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-30 bg-gradient-to-tr from-[#34d399] to-[#60a5fa] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>

        <div className="relative z-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
              Create your account
            </h2>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
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
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 outline outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600"
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
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 outline outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600"
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
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 outline outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600"
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
                  {loading ? "Signing up..." : "Sign up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
