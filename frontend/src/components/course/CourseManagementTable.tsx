import type { Course, CourseManagmentState } from "@/types/course";
import { formatDateInTimezone } from "@/utils/userTimezone";

interface Props {
    courses: Course[];
    courseManagementState: CourseManagmentState;
    onOpenEditModal: (course: Course) => void;
}
/**
 * Renders the course management table and row action buttons.
 * @param props - Component props.
 * @param props.courses - The list of courses being managed.
 * @param props.courseManagementState - States used in CourseManagement.
 * @param props.onOpenEditModal - Method called when the edit modal is opened.
 */
export default function CourseManagementTable({
    courses,
    courseManagementState,
    onOpenEditModal,
}: Props) {
    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Course Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Created
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {courses.map((course) => (
                        <tr key={course.id} className="transition-colors hover:bg-gray-50">
                            <td className="whitespace-nowrap px-4 py-4">
                                <div className="font-medium text-gray-900">{course.name}</div>
                                <div className="text-xs text-gray-500">ID: {course.id}</div>
                            </td>
                            <td className="px-4 py-4">
                                <p className="max-w-xs truncate text-sm text-gray-600">
                                    {course.description || "—"}
                                </p>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                                <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                    course.active !== false
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                                >
                                {course.active !== false ? "Active" : "Inactive"}
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                                {formatDateInTimezone(course.created_at)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => courseManagementState.setStudentsTarget(course)}
                                        className="rounded-md border border-indigo-300 px-3 py-1.5 text-sm text-indigo-700 transition-colors hover:bg-indigo-50"
                                    >
                                        View students
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onOpenEditModal(course)}
                                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => courseManagementState.setDeleteTarget(course)}
                                        className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}