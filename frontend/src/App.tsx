import { Routes, Route } from "react-router-dom"
import { Home, Login, Signup, CalendarPage, TaskList} from "./pages/index"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route path="/login" element={<Login />}></Route>
      <Route path="/signup" element={<Signup />}></Route>
      <Route path="/calendar" element={<CalendarPage />}></Route>
      <Route path="/tasks" element={<TaskList />}></Route>
    </Routes>
  )
}
