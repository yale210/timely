import { useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import RequireAuth from "@/components/auth/RequireAuth"
import RedirectAuth from "@/components/auth/RedirectAuth"
import { Home, Login, Signup, Logout, CalendarPage, TaskList, EventList, Gradebook, Dashboard, WeeklySummaries, Settings , Themes} from "./pages/index"

/**
 * The root component of the application which organises the routing logic.
 * @returns The rendered application routes.
 */
export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      document.documentElement.dataset.theme = savedTheme
    }

    const savedFont = localStorage.getItem("font")
    if (savedFont) {
      document.documentElement.dataset.font = savedFont
    }
  }, [])

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

      <Route path="/settings" element={
        <RequireAuth>
          <Settings />
        </RequireAuth>}
      />

      <Route path="/themes" element={
        <RequireAuth>
          <Themes />
        </RequireAuth>}
      />

    </Routes>
  )
}
