import { useEffect } from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import RequireAuth from "@/components/auth/RequireAuth"
import RedirectAuth from "@/components/auth/RedirectAuth"
import RequireAdmin from "@/components/auth/RequireAdmin"
import { Home, Login, Signup, Logout, CalendarPage, TaskList, Gradebook, Dashboard, Settings } from "@/pages"
import { Notifications } from "@/pages/Notification/Notifications"
import { NotificationDetail } from "@/pages/Notification/NotificationDetail"
import { AdminNotifications } from "@/pages/Admin/Notifications/AdminNotifications"
import { AdminNotificationHistory } from "@/pages/Admin/Notifications/AdminNotificationHistory"
import { AdminNotificationHistoryDetail } from "@/pages/Admin/Notifications/AdminNotificationHistoryDetail"

const PUBLIC_ROUTES = ["/login", "/signup", "/"]

/**
 * The root component of the application which organises the routing logic.
 * @returns The rendered application routes.
 */
export default function App() {
  const location = useLocation()

  useEffect(() => {
    // Public entry routes intentionally keep the default theme/font instead of user preferences.
    if (!PUBLIC_ROUTES.includes(location.pathname)) {
      const savedTheme = localStorage.getItem("theme")
      if (savedTheme) {
        document.documentElement.dataset.theme = savedTheme
      }

      const savedFont = localStorage.getItem("font")
      if (savedFont) {
        document.documentElement.dataset.font = savedFont
      }
    }
    else {
      document.documentElement.dataset.theme = "light"
      document.documentElement.dataset.font = "poppins"
    }
  }, [location.pathname])

  return (
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

      <Route path="/gradebook" element={
        <RequireAuth>
          <Gradebook />
        </RequireAuth>}
      />

      <Route path="/dashboard" element={
        <RequireAuth>
          <Dashboard />
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
    </Routes>
  )
}
