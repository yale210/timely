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

import api from "./api"

export const authService = {
  async register(payload: { username: string; email: string; password: string; password2: string; }) {
    const { data } = await api.post<AuthResponse>("/api/authentication/register/", payload)

    const token = getTokenFromResponse(data)
    if (token) authStore.setToken(token)
    if (data.user) authStore.setUser(data.user)

    return data
  },

  async login(payload: { username: string; password: string }) {
    const { data } = await api.post<AuthResponse>("/api/authentication/session/", payload)

    const token = getTokenFromResponse(data)
    if (!token) throw new Error("Login succeeded but no token was returned.")

    authStore.setToken(token)
    if (data.user) authStore.setUser(data.user)

    return data
  },

  async logout() {
    // Knox typically invalidates the current token server-side
    try {
      await api.post("/api/authentication/logout/")
    } finally {
      authStore.clear()
    }
  },
}
