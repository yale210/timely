const API_BASE = "http://localhost:8000"
export const AUTH_CHANGE_EVENT = "auth-change"

const broadcastAuthChange = () => window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))

interface User {
  id?: number
  username: string
  email: string
  [key: string]: unknown
}

interface AuthResponse {
  token?: string
  key?: string // some libs use "token" or "key"
  auth_token?: string
  user?: User
  [key: string]: unknown
}

interface ErrorPayload {
  detail?: string
}

const isUser = (value: unknown): value is User => {
  if (!value || typeof value !== "object") return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.username === "string" &&
    typeof obj.email === "string" &&
    (obj.id === undefined || typeof obj.id === "number")
  )
}

function getTokenFromResponse(data: AuthResponse) {
  return data.token ?? data.key ?? data.auth_token ?? null
}

function extractErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "detail" in data) {
    const { detail } = data as ErrorPayload
    if (typeof detail === "string") return detail
  }
  if (typeof data === "string") return data
  return fallback
}

export const authStore = {
  getToken(): string | null {
    return localStorage.getItem("auth_token")
  },
  setToken(token: string) {
    localStorage.setItem("auth_token", token)
    broadcastAuthChange()
  },
  clear() {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    broadcastAuthChange()
  },
  setUser(user: User) {
    localStorage.setItem("auth_user", JSON.stringify(user))
    broadcastAuthChange()
  },
  getUser(): User | null {
    const raw = localStorage.getItem("auth_user")
    if (!raw) return null
    try {
      const parsed: unknown = JSON.parse(raw)
      return isUser(parsed) ? parsed : null
    } catch {
      return null
    }
  },
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  includeAuth = false
): Promise<T> {
  const headers = new Headers(options.headers ?? {})
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  if (includeAuth) {
    const token = authStore.getToken()
    if (token) headers.set("Authorization", `Token ${token}`)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const text = await res.text()
  const data: unknown = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message = extractErrorMessage(data, `Request failed (${res.status})`)
    throw new Error(message)
  }

  return data as T
}

export const authService = {
  async register(payload: { username: string; email: string; password: string }) {
    const data = await request<AuthResponse>("/api/authentication/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    const token = getTokenFromResponse(data)
    if (token) authStore.setToken(token)
    if (data.user) authStore.setUser(data.user)

    return data
  },

  async login(payload: { username: string; email: string; password: string }) {
    const data = await request<AuthResponse>("/api/authentication/session/", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    const token = getTokenFromResponse(data)
    if (!token) throw new Error("Login succeeded but no token was returned.")

    authStore.setToken(token)
    if (data.user) authStore.setUser(data.user)

    return data
  },

  async logout() {
    // Knox typically invalidates the current token server-side
    await request("/api/authentication/logout/", { method: "POST" }, true)
    authStore.clear()
  },
}
