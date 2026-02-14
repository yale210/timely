import { Statcard } from "../components/index"
import { CalendarPage } from "./index"



/**
 * Renders the main dashboard page with stat cards and an embedded calendar.
 */
export default function Dashboard(){
  return(
  <div className="min-h-screen bg-white">
    <main className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
      <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Overview of your schedule and upcoming tasks
          </p>
      </header>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Statcard title="Today's Tasks" value={["do part one of courswork", "review pr for coursework"]}/>
        <Statcard title="Pending Tasks" value={[]}/>
        <Statcard title="Overdue Tasks" value={[]}/>

        <section className=" col-span-3 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 m-6">
          <CalendarPage />
        </section>

      </section>
    </main>
  </div>
  )
}
