import { Routes, Route } from "react-router-dom"
import { Home, Login, Signup, CalendarPage, Dashboard, TaskList, Gradebook } from "./pages/index"

/**
 * The root component of the application which organises the routing logic.
 * @returns The rendered application routes.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route path="/login" element={<Login />}></Route>
      <Route path="/signup" element={<Signup />}></Route>
      <Route path="/calendar" element={<CalendarPage />}></Route>
      <Route path="/dashboard" element={<Dashboard />}></Route>
      <Route path="/tasks" element={<TaskList />} />
      <Route path="/gradebook" element={<Gradebook />} />
    </Routes>
  )
}
