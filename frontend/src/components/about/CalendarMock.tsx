function CalendarMockup() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const slots = [
    { day: 0, label: "Study", color: "#60a5fa" },
    { day: 0, label: "Lecture", color: "#a78bfa" },
    { day: 1, label: "Lab", color: "#34d399" },
    { day: 2, label: "Meeting", color: "#f59e0b" },
    { day: 2, label: "Revision", color: "#818cf8" },
    { day: 3, label: "Lecture", color: "#a78bfa" },
    { day: 4, label: "Deadline", color: "#f87171" },
    { day: 5, label: "Reading", color: "#34d399" },
    { day: 6, label: "Study", color: "#60a5fa" },
  ]
  return (
    <div className="rounded-xl bg-white p-5 shadow-md ring-1 ring-gray-900/8">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-base font-semibold text-gray-900">Weekly Agenda</p>
        <span className="material-icons text-gray-400" style={{ fontSize: "18px" }}>
          calendar_view_week
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <p key={day} className="pb-1 text-center text-xs font-medium text-gray-400">
            {day}
          </p>
        ))}
        {days.map((_, dayIdx) => (
          <div key={dayIdx} className="flex flex-col gap-0.5">
            <div className="relative min-h-24 overflow-hidden rounded-md bg-gray-50 p-0.5">
              {slots
                .filter((s) => s.day === dayIdx)
                .map((slot) => (
                  <div
                    key={slot.label + slot.day}
                    className="mb-0.5 truncate rounded px-1 py-0.5 text-white"
                    style={{ backgroundColor: slot.color, fontSize: "9px" }}
                  >
                    {slot.label}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


export default CalendarMockup;