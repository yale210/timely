import { describe, it, expect, vi, beforeEach } from "vitest"
import api from "@/services/api"
import { authStore } from "@/services/authService"

interface HeaderLike {
  get?: (key: string) => string | undefined
}
type InterceptorFn = (config: { headers?: HeaderLike | Record<string, string> | undefined }) => {
  headers?: HeaderLike | Record<string, string>
}

vi.mock("axios", () => {
  class MockAxiosHeaders {
    private map = new Map<string, string>()
    constructor(init?: Record<string, string>) {
      if (init) Object.entries(init).forEach(([k, v]) => this.set(k, v))
    }
    set(key: string, value: string) {
      this.map.set(key.toLowerCase(), value)
    }
    get(key: string) {
      return this.map.get(key.toLowerCase())
    }
  }

  const handlers: InterceptorFn[] = []
  const instance = {
    interceptors: {
      request: {
        handlers,
        use: (fn: InterceptorFn) => {
          handlers.push(fn)
          return handlers.length - 1
        },
      },
    },
    defaults: {},
  }

  const create = vi.fn(() => instance)

  return { default: { create }, create, AxiosHeaders: MockAxiosHeaders }
})

vi.mock("@/services/authService", () => ({
  authStore: {
    getToken: vi.fn(),
  },
}))

const getInterceptor = (): InterceptorFn =>
  (api as unknown as { interceptors: { request: { handlers: InterceptorFn[] } } }).interceptors.request.handlers[0]

describe("api service interceptor", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("adds Authorization header when token exists", () => {
    const tokenSpy = vi.spyOn(authStore, "getToken").mockReturnValue("abc123")
    const interceptor = getInterceptor()

    const result = interceptor({ headers: undefined })
    const headers = result.headers as HeaderLike

    expect(headers?.get?.("authorization")).toBe("Token abc123")
    tokenSpy.mockRestore()
  })

  it("leaves headers untouched when no token", () => {
    const tokenSpy = vi.spyOn(authStore, "getToken").mockReturnValue(null)
    const interceptor = getInterceptor()
    const orig = { foo: "bar" }

    const result = interceptor({ headers: orig })

    expect(result.headers).toBe(orig)
    tokenSpy.mockRestore()
  })

  it("preserves existing headers and appends Authorization", () => {
    const tokenSpy = vi.spyOn(authStore, "getToken").mockReturnValue("token-1")
    const interceptor = getInterceptor()
    const result = interceptor({ headers: { "X-Test": "42" } })

    const headers = result.headers as HeaderLike
    expect(headers?.get?.("x-test")).toBe("42")
    expect(headers?.get?.("authorization")).toBe("Token token-1")
    tokenSpy.mockRestore()
  })
})
