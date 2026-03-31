import { useCallback, useEffect, useRef, useState } from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import RequireAuth from "@/components/auth/RequireAuth"
import RedirectAuth from "@/components/auth/RedirectAuth"
import RequireAdmin from "@/components/auth/RequireAdmin"
import Courses from "@/pages/Course/Course.tsx"
import CourseDetail from "@/pages/Course/CourseDetail.tsx"
import {
  Home,
  Login,
  Signup,
  Logout,
  CalendarPage,
  TaskList,
  Assessments,
  Gradebook,
  Dashboard,
  Settings,
  Friends,
  Sharing,
  ProfilePage,
  Leaderboard,
  Pomodoro,
  NotFound,
  About
} from "@/pages"
import { Notifications } from "@/pages/Notification/Notifications"
import { NotificationDetail } from "@/pages/Notification/NotificationDetail"
import { AdminNotifications } from "@/pages/AdminNotifications/AdminNotifications"
import { AdminNotificationHistory } from "@/pages/AdminNotifications/AdminNotificationHistory"
import { AdminNotificationHistoryDetail } from "@/pages/AdminNotifications/AdminNotificationHistoryDetail"
import CourseManagement from "@/pages/Course/CourseManagement.tsx";
import RequireTeacher from "@/context/auth/RequireTeacher.tsx";
import CourseCreate from "@/pages/Course/CourseCreate.tsx";
import { AUTH_CHANGE_EVENT, authStore } from "@/services/authService";
import { preferenceService } from "@/services/preferenceService";
import { setDocumentTheme } from "@/utils/themeSettings"
import { resetStoredUserTimezone, setStoredUserTimezone } from "@/utils/userTimezone";
import {
  resetStoredUserPreferences,
  setStoredDefaultLandingPage,
  setStoredTimeFormat,
  setStoredWeekStartsOn,
} from "@/utils/userPreferences";
import type { Preference } from "@/types";
import { MOBILE_ROUTE_LOADING_EVENT } from "@/utils/routeLoading";

const PUBLIC_ROUTES = ["/login", "/signup", "/", "/about"]
const MOBILE_ROUTE_LOADING_MIN_MS = 280;
const MOBILE_ROUTE_LOADING_FALLBACK_MS = 1500;

const isMobileViewport = () => typeof window !== "undefined" && window.innerWidth < 768;

const resetStoredPreferenceBootstrap = () => {
  resetStoredUserTimezone();
  resetStoredUserPreferences();
};

const applyStoredPreferenceBootstrap = (preference: Preference) => {
  setStoredUserTimezone(preference.timezone);
  setStoredDefaultLandingPage(preference.default_landing_page ?? "dashboard");
  setStoredWeekStartsOn(preference.week_starts_on ?? "monday");
  setStoredTimeFormat(preference.time_format ?? "24h");
};

const syncStoredPreferenceBootstrap = async (isMounted: () => boolean) => {
  if (!authStore.getToken()) {
    resetStoredPreferenceBootstrap();
    return;
  }

  try {
    const preference = await preferenceService.getMyPreference();
    if (isMounted()) {
      applyStoredPreferenceBootstrap(preference);
    }
  } catch {
    if (isMounted()) {
      resetStoredPreferenceBootstrap();
    }
  }
};

const useStoredPreferenceBootstrap = () => {
  useEffect(() => {
    let isMounted = true;
    const handleAuthChange = () => {
      void syncStoredPreferenceBootstrap(() => isMounted);
    };

    handleAuthChange();
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, []);
};

const useMobileRouteLoadingOverlay = (pathname: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);
  const loadingStartPathRef = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (fallbackTimeoutRef.current !== null) {
      window.clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleRouteLoadingStart = () => {
      if (!isMobileViewport()) return;
      clearTimers();
      loadingStartPathRef.current = pathname;
      setIsLoading(true);
      fallbackTimeoutRef.current = window.setTimeout(() => {
        setIsLoading(false);
        loadingStartPathRef.current = null;
        fallbackTimeoutRef.current = null;
      }, MOBILE_ROUTE_LOADING_FALLBACK_MS);
    };

    window.addEventListener(MOBILE_ROUTE_LOADING_EVENT, handleRouteLoadingStart);
    return () => {
      clearTimers();
      window.removeEventListener(MOBILE_ROUTE_LOADING_EVENT, handleRouteLoadingStart);
    };
  }, [clearTimers, pathname]);

  useEffect(() => {
    if (!isLoading) return;
    if (!isMobileViewport()) {
      clearTimers();
      loadingStartPathRef.current = null;
      queueMicrotask(() => {
        setIsLoading(false);
      });
      return;
    }

    if (loadingStartPathRef.current === pathname) {
      return;
    }

    if (fallbackTimeoutRef.current !== null) {
      window.clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }

    hideTimeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
      loadingStartPathRef.current = null;
      hideTimeoutRef.current = null;
    }, MOBILE_ROUTE_LOADING_MIN_MS);

    return () => {
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [clearTimers, pathname, isLoading]);

  return isLoading;
};

/**
 * The root component of the application which organises the routing logic.
 * @returns The rendered application routes.
 */
export default function App() {
  const location = useLocation()
  useStoredPreferenceBootstrap();
  const isMobileRouteLoading = useMobileRouteLoadingOverlay(location.pathname);

  useEffect(() => {
    // Public entry routes intentionally keep the default theme/font instead of user preferences.
    if (!PUBLIC_ROUTES.includes(location.pathname)) {
      const savedTheme = localStorage.getItem("theme")
      if (savedTheme) {
        setDocumentTheme(savedTheme)
      }

      const savedFont = localStorage.getItem("font")
      if (savedFont) {
        document.documentElement.dataset.font = savedFont
      }
    }
    else {
      setDocumentTheme("light")
      document.documentElement.dataset.font = "poppins"
    }
  }, [location.pathname])

  return (
    <>
      <Routes>
        <Route path="/" element={
          <RedirectAuth>
            <Home />
          </RedirectAuth>
        }/>

      <Route path="/login" element={
        <RedirectAuth>
          <Login />
        </RedirectAuth>
      }/>

      <Route path="/signup" element={
        <RedirectAuth>
          <Signup />
        </RedirectAuth>
      }/>
        <Route path="/course/create" element={
          <RequireAuth>
            <CourseCreate />
          </RequireAuth>
        }/>
      <Route path="/logout" element={<Logout />} />

      <Route path="/calendar" element={
        <RequireAuth>
          <CalendarPage />
        </RequireAuth>
      } />

      <Route path="/tasks" element={
        <RequireAuth>
          <TaskList />
        </RequireAuth>}
      />

      <Route path="/courses" element={
        <RequireAuth>
          <Courses />
        </RequireAuth>}
      />

      <Route path="/courses/:id" element={
        <RequireAuth>
          <CourseDetail />
        </RequireAuth>}
      />

      <Route path="/courses/manage" element={
          <RequireAuth>
        <RequireTeacher>
          <CourseManagement />
        </RequireTeacher>
          </RequireAuth>}
      />

      <Route path="/gradebook" element={
        <RequireAuth>
          <Gradebook />
        </RequireAuth>}
      />

      <Route path="/assessments" element={
        <RequireAuth>
          <Assessments />
        </RequireAuth>}
      />

      <Route path="/friends" element={
        <RequireAuth>
          <Friends />
        </RequireAuth>}
      />

      <Route path="/sharing" element={
        <RequireAuth>
          <Sharing />
        </RequireAuth>}
      />

      <Route path="/leaderboard" element={
        <RequireAuth>
          <Leaderboard />
        </RequireAuth>}
      />

      <Route path="/pomodoro" element={
        <RequireAuth>
          <Pomodoro />
        </RequireAuth>}
      />

      <Route path="/profiles/:username" element={
        <RequireAuth>
          <ProfilePage />
        </RequireAuth>}
      />

      <Route path="/notifications" element={
        <RequireAuth>
          <Notifications />
        </RequireAuth>
      } />

      <Route path="/notifications/:id" element={
        <RequireAuth>
          <NotificationDetail />
        </RequireAuth>
      } />

      <Route path="/admin/notifications" element={
        <RequireAdmin>
          <AdminNotifications />
        </RequireAdmin>
      } />

      <Route path="/admin/notifications/history" element={
        <RequireAdmin>
          <AdminNotificationHistory />
        </RequireAdmin>
      } />

      <Route path="/admin/notifications/history/:id" element={
        <RequireAdmin>
          <AdminNotificationHistoryDetail />
        </RequireAdmin>
      } />

      <Route path="/settings" element={
        <RequireAuth>
          <Settings />
        </RequireAuth>}
      />

      <Route path="/dashboard" element={
        <RequireAuth>
          <Dashboard />
        </RequireAuth>}
      />

      <Route path="/about" element={<About />} />

        <Route path="*" element={
          <NotFound />
        } />

      </Routes>

      {isMobileRouteLoading && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/15 backdrop-blur-sm md:hidden">
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 text-sm font-medium text-slate-700 shadow-lg ring-1 ring-slate-200"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
            Loading page...
          </div>
        </div>
      )}
    </>
  )
}
