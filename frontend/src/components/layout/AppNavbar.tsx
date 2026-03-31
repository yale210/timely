import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authStore } from "@/services/authService";
import { getMyProfile } from "@/services/profileService";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useNotificationContext } from "@/context/NotificationContext";
import { type Notification } from "@/types";
import AppNavbarAccountMenu from "@/components/layout/AppNavbarAccountMenu";
import AppNavbarDrawer from "@/components/layout/AppNavbarDrawer";
import { emitMobileRouteLoadingStart } from "@/utils/routeLoading";

const navItems = [
  { label: "Overview", to: "/dashboard", icon: "space_dashboard" },
  { label: "Calendar", to: "/calendar", icon: "calendar_month" },
  { label: "Tasks", to: "/tasks", icon: "checklist" },
];

const featureItems = [
  { key: "pomodoro", label: "Pomodoro", to: "/pomodoro", icon: "timer" },
  { key: "assessments", label: "Assessments", to: "/assessments", icon: "assignment" },
  { key: "gradebook", label: "Gradebook", to: "/gradebook", icon: "auto_graph" },
  { key: "courses", label: "Courses", to: "/courses", icon: "school" },
];

const FEATURE_FLAGS = {
  assessments: "feature_assessments_enabled",
  gradebook: "feature_gradebook_enabled",
  courses: "feature_courses_enabled",
  pomodoro: "feature_pomodoro_enabled",
};

const readFeatureFlag = (key: keyof typeof FEATURE_FLAGS) => {
  const raw = localStorage.getItem(FEATURE_FLAGS[key]);
  if (raw === null) return true;
  return raw === "true";
};

const buildFeatureFlags = () => ({
  assessments: readFeatureFlag("assessments"),
  gradebook: readFeatureFlag("gradebook"),
  courses: readFeatureFlag("courses"),
  pomodoro: readFeatureFlag("pomodoro"),
});

/**
 * AppNavbar renders the main navigation bar with a sliding drawer menu for Timely.
 */
export default function AppNavbar() {
  const [open, setOpen] = useState(() => {
    const raw = localStorage.getItem("nav_drawer_open");
    return raw === "true";
  });
  const drawerWidth = 224;
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [featureFlags, setFeatureFlags] = useState(buildFeatureFlags);
  const {
    notifications,
    unreadCount,
    markRead,
    markUnread,
    deleteNotification,
  } = useNotificationContext();

  const user = authStore.getUser();
  const isStaff = Boolean(user?.is_staff);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  const closeDrawerOnMobile = (nextPath?: string) => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      if (nextPath && nextPath !== location.pathname) {
        emitMobileRouteLoadingStart();
      }
      setOpen(false);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    void markRead(notification.id);
    void navigate(`/notifications/${notification.id}`);
  };

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    document.body.style.setProperty("--drawer-width", `${drawerWidth}px`);
    localStorage.setItem("nav_drawer_open", String(open));
    return () => {
      document.body.classList.remove("menu-open");
      document.body.style.removeProperty("--drawer-width");
    };
  }, [open, drawerWidth]);

  useEffect(() => {
    const refreshFlags = () => {
      setFeatureFlags(buildFeatureFlags());
    };
    window.addEventListener("feature-flags-changed", refreshFlags);
    window.addEventListener("storage", refreshFlags);
    return () => {
      window.removeEventListener("feature-flags-changed", refreshFlags);
      window.removeEventListener("storage", refreshFlags);
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    if (!user?.username) {
      queueMicrotask(() => {
        if (!isActive) return;
        setProfileAvatar(null);
      });
      return () => {
        isActive = false;
      };
    }

    const loadProfile = async () => {
      try {
        const profile = await getMyProfile();
        if (!isActive) return;
        setProfileAvatar(profile.avatar ?? null);
      } catch {
        if (!isActive) return;
        setProfileAvatar(null);
      }
    };

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, [user?.username]);

  const visibleFeatureItems = featureItems.filter((item) => {
    if (item.key === "assessments") return featureFlags.assessments;
    if (item.key === "gradebook") return featureFlags.gradebook;
    if (item.key === "courses") return featureFlags.courses;
    if (item.key === "pomodoro") return featureFlags.pomodoro;
    return false;
  });

  return (
    <header className="app-navbar fixed left-0 right-0 top-0 z-30 m-0 bg-white shadow-sm ring-1 ring-gray-200">
      <div className="app-navbar-grid grid min-h-10 w-full grid-cols-3 items-center gap-2 px-3 py-0">
        <div className="flex justify-start">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1"
          >
            <span className="sr-only">Open menu</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" x2="20" y1="7" y2="7" />
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="17" y2="17" />
            </svg>
          </button>
        </div>

        <div className="flex justify-center" />

        <div className="flex h-10 items-center justify-end gap-1.5">
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onItemClick={handleNotificationClick}
            onToggleRead={(notification) =>
              notification.is_read ? markUnread(notification.id) : markRead(notification.id)
            }
            onDeleteItem={(notification) => deleteNotification(notification.id)}
          />
          <AppNavbarAccountMenu user={user} profileAvatar={profileAvatar} />
        </div>
      </div>

      {open ? (
        <button
          type="button"
          aria-label="Dismiss navigation overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity md:hidden"
        />
      ) : null}

      <AppNavbarDrawer
        open={open}
        isAdminRoute={isAdminRoute}
        isStaff={isStaff}
        navItems={navItems}
        featureItems={visibleFeatureItems}
        onClose={() => setOpen(false)}
        onNavigate={closeDrawerOnMobile}
      />
    </header>
  );
}
