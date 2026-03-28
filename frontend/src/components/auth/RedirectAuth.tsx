import { Navigate, useLocation } from "react-router-dom"
import { authStore } from "@/services/authService"
import type { ReactNode } from "react"
import { getStoredDefaultLandingPagePath } from "@/utils/userPreferences";

/**
 * Redirects authenticated users to the dashboard; otherwise renders children.
 * @param root0 - Component props.
 * @param root0.children - Content to render when the user is not authenticated.
 */
export default function RedirectIfAuth({ children }: { children: ReactNode}) {
    const user = authStore.getToken()
    const location = useLocation()

    if (user) {
        return <Navigate to={getStoredDefaultLandingPagePath()} replace state={{ from: location}}/>
    }
    else {
        return <>{ children }</>
    }
}
