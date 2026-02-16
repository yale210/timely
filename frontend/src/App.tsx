import { Routes, Route } from "react-router-dom"
import { Home, Login, Signup, CalendarPage, TaskList, EventList, Gradebook, Notifications, NotificationDetail, AdminNotifications } from "./pages/index"

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
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/tasks" element={<TaskList />} />
      <Route path="/events" element={<EventList />} />
      <Route path="/gradebook" element={<Gradebook />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/notifications/:id" element={<NotificationDetail />} />
      <Route path="/admin/notifications" element={<AdminNotifications />} />
    </Routes>
  )
}
