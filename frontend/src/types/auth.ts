/**
 * Represents the authenticated user details returned by the backend.
 * @interface User
 */
export interface User {
  id?: number
  username: string
  email: string
  is_staff?: boolean
  is_superuser?: boolean
  [key: string]: unknown
}

/**
 * Represents the authentication payload returned after login or registration.
 * @interface AuthResponse
 */
export interface AuthResponse {
  token?: string
  key?: string
  auth_token?: string
  user?: User
  [key: string]: unknown
}
