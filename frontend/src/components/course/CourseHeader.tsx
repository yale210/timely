interface CoursesHeaderProps {
  search: string;
  joinCourseId: string;
  onSearchChange: (value: string) => void;
  onJoinCourseIdChange: (value: string) => void;
  onJoinCourse: () => void;
  onRefresh: () => void;
  isTeacher: boolean;
  onCreateCourse: () => void;
  onManageCourses: () => void;
}

/**
 *
 * @param root0
 * @param root0.search
 * @param root0.joinCourseId
 * @param root0.onSearchChange
 * @param root0.onJoinCourseIdChange
 * @param root0.onJoinCourse
 * @param root0.onRefresh
 * @param root0.onCreateCourse
 * @param root0.onManageCourses
 * @param root0.isTeacher
 */
export default function CoursesHeader({
  search,
  joinCourseId,
  onSearchChange,
  onJoinCourseIdChange,
  onJoinCourse,
  onRefresh,
    onCreateCourse,
    onManageCourses,
                                        isTeacher,
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
              type="text"
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
            {isTeacher && (
                <button
              type="button"
              onClick={onCreateCourse}
              className="rounded-md  px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 bg-primary"
            >
              Create course
            </button>
            )}
            {isTeacher && (
              <button
                type="button"
                onClick={onManageCourses}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Manage
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}