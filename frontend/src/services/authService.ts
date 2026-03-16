import api from "@/services/api"
import type { AuthResponse, User } from "@/types"

// Create custom browser event, app is notified when user data changes
export const AUTH_CHANGE_EVENT = "auth-change"
const broadcastAuthChange = () => window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))

// Prevents invalid JSON formatting
const isUser = (value: unknown): value is User => {
  if (!value || typeof value !== "object") {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.username === "string" &&
    typeof obj.email === "string" &&
    (obj.id === undefined || typeof obj.id === "number")
  )
}

// Retrieve token according to backend
function getTokenFromResponse(data: AuthResponse) {
  return data.token ?? data.key ?? data.auth_token ?? null
}

// Local browser storage
export const authStore = {
  // Retrieve token
  getToken(): string | null {
    return localStorage.getItem("auth_token")
  },
  // Set token
  setToken(token: string) {
    localStorage.setItem("auth_token", token)
    broadcastAuthChange()
  },
  // Clear all tokens
  clear() {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    broadcastAuthChange()
  },
  // Set user object as JSON in local storage
  setUser(user: User) {
    localStorage.setItem("auth_user", JSON.stringify(user))
    broadcastAuthChange()
  },
  // Retrieve user
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

// Backend API layer for authentication
export const authService = {
  // Sends signup data to '/api/authentication/register/'
  async register(payload: { username: string; email: string; password: string; password2: string; }) {
    const { data } = await api.post<AuthResponse>("/api/authentication/register/", payload)

    const token = getTokenFromResponse(data)
    if (token) authStore.setToken(token)
    if (data.user) authStore.setUser(data.user)

    return data
  },

  // Sends login data to '/api/authentication/session/'
  async login(payload: { username: string; password: string }) {
    const { data } = await api.post<AuthResponse>("/api/authentication/session/", payload)

    const token = getTokenFromResponse(data)
    if (!token) throw new Error("Login succeeded but no token was returned.")

    authStore.setToken(token)
    if (data.user) authStore.setUser(data.user)

    return data
  },

  // Sends logout data to '/api/authentication/logout/'
  async logout() {
    try {
      await api.post("/api/authentication/logout/")
    } finally {
      authStore.clear()
    }
  },
}
