import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";

/**
 * Displays a temporary message while logging the current user out.
 * @returns A centered status message and redirect behavior.
 */
export default function LogoutMessage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Signing you out...");

  useEffect(() => {
    let cancelled = false;

    void authService
      .logout()
      .catch((err: unknown) => {
        const text = err instanceof Error ? err.message : "Logout failed";
        if (!cancelled) {
          setMessage(text);
        }
      })
      .finally(() => {
        if (!cancelled) {
          void navigate("/login", { replace: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="text-center text-gray-700">{message}</div>
    </main>
  );
}
