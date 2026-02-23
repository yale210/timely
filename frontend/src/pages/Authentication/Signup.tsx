import { useState, useEffect, type FormEvent } from "react"
import { HomeNavbar, Footer, BlurBackground } from "@/components/index"
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

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");    
    if (savedTheme) {
      document.documentElement.dataset.theme = savedTheme;
      console.log("loaded saved theme")
    }

    const savedFont = localStorage.getItem("font");
    if (savedFont) {
      document.documentElement.dataset.font = savedFont;
    }
  }, []);

  return (
    <div className="bg-white">
      <HomeNavbar />
      <div className="relative isolate flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
        <BlurBackground />

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
