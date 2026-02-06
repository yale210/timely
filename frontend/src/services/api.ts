import { authStore } from "@/services/authService"

const API_BASE = "http://localhost:8000"

interface ErrorBody {
  detail?: string
}

function extractDetail(payload: unknown): string | null {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const { detail } = payload as ErrorBody
    if (typeof detail === "string") return detail
  }
  return null
}

/**
 * Wrapper around `fetch` that injects the auth token (if present) and parses JSON safely.
 * @param path API path, e.g. `/api/tasks/`
 * @param options Standard fetch options
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = authStore.getToken()

  const headers = new Headers(options.headers ?? {})
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (token) {
    headers.set("Authorization", `Token ${token}`)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  // handle empty response bodies safely
  const text = await res.text()
  const data: unknown = text ? JSON.parse(text) : null

  if (!res.ok) {
    const fallback = `API error: ${res.status}${res.statusText ? ` ${res.statusText}` : ""}`
    const message = extractDetail(data) ?? fallback
    throw new Error(message)
  }

  return data as T
}
