
function TasksMockup() {
  const items = [
    { title: "Algorithms Assignment", due: "Today, 5:00 PM", color: "#3b82f6", done: true },
    { title: "Research Paper Draft", due: "Tomorrow, 11:59 PM", color: "#8b5cf6", done: false },
    { title: "Lab Report Submission", due: "Wed, 2:00 PM", color: "#10b981", done: false },
    { title: "Revision Session", due: "Fri, 4:00 PM", color: "#f59e0b", done: false },
  ]
  return (
    <div className="rounded-xl bg-white p-5 shadow-md ring-1 ring-gray-900/8">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-base font-semibold text-gray-900">Upcoming Tasks</p>
        <span className="text-xs font-semibold text-cyan-600">See all</span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-center gap-3 rounded-lg border px-3 py-2"
            style={{ borderColor: item.color, backgroundColor: `${item.color}14` }}
          >
            <span
              className="material-icons shrink-0"
              style={{ fontSize: "20px", color: item.done ? item.color : "#cbd5e1" }}
            >
              {item.done ? "check_circle" : "radio_button_unchecked"}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-medium ${
                  item.done ? "text-gray-400 line-through" : "text-gray-800"
                }`}
              >
                {item.title}
              </p>
              <p className="mt-0.5 flex items-center gap-0.5 text-xs text-gray-500">
                <span className="material-icons" style={{ fontSize: "13px" }}>
                  event
                </span>
                {item.due}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TasksMockup;