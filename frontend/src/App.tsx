import { Routes, Route } from "react-router-dom"
import RequireAuth from "@/components/RequireAuth"
import RequireAdmin from "@/components/RequireAdmin"
import { Home, Login, Signup, Logout, CalendarPage, TaskList, EventList, Gradebook, Dashboard, WeeklySummaries } from "./pages/index"
import { Notifications } from "./pages/Notifications"
import { NotificationDetail } from "./pages/NotificationDetail"
import { default as AdminNotifications } from "./pages/AdminNotifications"

/**
 * The root component of the application which organises the routing logic.
 * @returns The rendered application routes.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
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

      <Route path="/events" element={
        <RequireAuth>
          <EventList />
        </RequireAuth>
      } />

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

      <Route path="/weekly-summaries" element={
        <RequireAuth>
          <WeeklySummaries />
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

    </Routes>
  )
}
