function SocialMockup() {
  const users = [
    { rank: 1, initials: "AK", name: "Alex K.", xp: "8,920", isYou: false },
    { rank: 2, initials: "ST", name: "Sam T.", xp: "7,340", isYou: false },
    { rank: 3, initials: "JM", name: "Jordan M.", xp: "6,100", isYou: false },
    { rank: 4, initials: "YO", name: "You", xp: "5,670", isYou: true },
    { rank: 5, initials: "PL", name: "Priya L.", xp: "4,890", isYou: false },
  ]
  const rankStyle = [
    "bg-amber-100 text-amber-700",
    "bg-gray-100 text-gray-500",
    "bg-orange-100 text-orange-600",
  ]
  return (
    <div className="rounded-xl bg-white p-5 shadow-md ring-1 ring-gray-900/8">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-base font-semibold text-gray-900">Leaderboard</p>
        <span className="material-icons text-gray-400" style={{ fontSize: "18px" }}>
          leaderboard
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {users.map((user) => (
          <li
            key={user.name}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
              user.isYou ? "bg-blue-50 ring-2 ring-blue-200" : ""
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                user.rank <= 3 ? rankStyle[user.rank - 1] : "bg-gray-50 text-gray-500"
              }`}
            >
              {user.rank}
            </span>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                user.isYou ? "bg-blue-500" : "bg-gray-400"
              }`}
            >
              {user.initials}
            </span>
            <p
              className={`flex-1 text-sm font-medium ${
                user.isYou ? "text-blue-700" : "text-gray-800"
              }`}
            >
              {user.name}
            </p>
            <p className="text-xs font-semibold text-gray-500">{user.xp} XP</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SocialMockup
