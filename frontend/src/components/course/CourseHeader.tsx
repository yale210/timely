import type {JSX} from "react";

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
 * Renders the header component for the courses page, providing UI elements for search, course joining,
 * and other course management functionalities.
 * @param props - The properties object.
 * @param props.search - The current value of the search input.
 * @param props.joinCourseId - The current value of the course ID input for joining a course.
 * @param props.onSearchChange - Callback triggered when the search input value changes.
 * @param props.onJoinCourseIdChange - Callback triggered when the course ID input value changes.
 * @param props.onJoinCourse - Callback triggered when the user attempts to join a course.
 * @param props.onRefresh - Callback triggered when the user refreshes the course list.
 * @param props.onCreateCourse - Callback triggered when the user clicks to create a new course (only visible for teachers).
 * @param props.onManageCourses - Callback triggered when the user manages courses (only visible for teachers).
 * @param props.isTeacher - Indicates whether the current user is a teacher, affecting which actions are available.
 * @returns The rendered CoursesHeader component.
 */
export default function CoursesHeader({
  search,
  joinCourseId,
  onSearchChange,
  onJoinCourseIdChange,
  onJoinCourse,
  onRefresh,
    onManageCourses,
                                        isTeacher,
}: CoursesHeaderProps): JSX.Element {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-black">Courses</h2>
          <p className="text-sm text-gray-500">Browse and manage available courses.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                onClick={onManageCourses}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Manage
              </button>
            )}
          </div>

          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="block w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            placeholder="Search courses"
          />
        </div>
      </div>
    </header>
  );
}