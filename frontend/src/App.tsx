import { Routes, Route } from "react-router-dom"
import RequireAuth from "@/components/RequireAuth"
import { Home, Login, Signup, Logout, CalendarPage, TaskList, EventList, Gradebook } from "./pages/index"

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

      <Route path="/tasks" element={<TaskList />} />
      <Route path="/events" element={<EventList />} />
      <Route path="/gradebook" element={<Gradebook />} />
    </Routes>
  )
}
