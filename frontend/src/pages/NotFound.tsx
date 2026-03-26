import { Link } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import { authStore } from "@/services/authService";

/**
 * Renders a 404 not found page if the URL is unknown
 */
export default function NotFound() {
  const isAuthenticated = Boolean(authStore.getToken());
  const primaryCta = isAuthenticated
    ? { to: "/dashboard", label: "Go Overview" }
    : { to: "/", label: "Go Home" };

  return (
    <AppLayout showNavbar={isAuthenticated}>
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg text-center space-y-4">
          <p className="text-sm font-semibold tracking-[0.3em] uppercase text-gray-500">
            404
          </p>
          <h1 className="text-4xl font-bold">Page not found</h1>
          <p className="text-gray-600">
            The page you requested does not exist or the link is no longer valid.
          </p>
          <div className="flex justify-center gap-3">
            <Link to={primaryCta.to} className="rounded-md bg-black px-4 py-2 text-white">
              {primaryCta.label}
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
