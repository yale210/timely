function XPMockup() {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-md ring-1 ring-gray-900/8">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-gray-900">Your Progress</p>
        <span className="material-icons text-amber-500">military_tech</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
          <div className="text-center">
            <p className="text-xs font-semibold leading-none text-white/80">LVL</p>
            <p className="text-2xl font-bold leading-tight text-white">12</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Level 12</p>
          <p className="text-xs text-gray-500">2,340 / 3,800 XP to next level</p>
          <div className="mt-2 h-2 w-40 rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-amber-400 transition-all" style={{ width: "61%" }} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-rose-50 p-2.5 text-center">
          <p className="mb-0.5 text-xs text-gray-500">Streak</p>
          <div className="flex items-center justify-center gap-1">
            <span className="material-icons text-rose-500" style={{ fontSize: "14px" }}>
              local_fire_department
            </span>
            <p className="text-base font-bold text-rose-600">7</p>
          </div>
        </div>
        <div className="rounded-lg bg-cyan-50 p-2.5 text-center">
          <p className="mb-0.5 text-xs text-gray-500">Done</p>
          <p className="text-base font-bold text-cyan-600">142</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-2.5 text-center">
          <p className="mb-0.5 text-xs text-gray-500">This week</p>
          <p className="text-base font-bold text-emerald-600">18</p>
        </div>
      </div>
    </div>
  )
}


export default XPMockup;