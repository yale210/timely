interface CoursesHeaderProps {
  search: string;
  joinCourseId: string;
  onSearchChange: (value: string) => void;
  onJoinCourseIdChange: (value: string) => void;
  onJoinCourse: () => void;
  onRefresh: () => void;
}

export default function CoursesHeader({
  search,
  joinCourseId,
  onSearchChange,
  onJoinCourseIdChange,
  onJoinCourse,
  onRefresh,
}: CoursesHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-black">Courses</h2>
          <p className="text-sm text-gray-500">Browse and manage available courses.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="block w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            placeholder="Search courses"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="number"
              value={joinCourseId}
              onChange={(event) => onJoinCourseIdChange(event.target.value)}
              className="block w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              placeholder="Course ID"
            />
            <button
              type="button"
              onClick={onJoinCourse}
              disabled={!joinCourseId.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Join
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="bg-primary hover:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}