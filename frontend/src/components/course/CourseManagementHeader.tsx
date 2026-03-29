import { useEffect, useState } from "react";
import type { UseCoursesState, UseCoursesActions } from "@/types/course"

interface Props {
    state: UseCoursesState;
    actions: UseCoursesActions;
    refreshCourses: () => void;
    openCreateModal: () => void;
}

/**
 * Renders the course management page header and top-level actions.
 * @param props - Component props.
 * @param props.state Basic data on the selected course, a list of courses, etc.
 * @param props.actions Actions that can be called on the courses.
 * @param props.refreshCourses - Method called when refrshing actions.
 * @param props.openCreateModal Method called when the "New course" modal is opened.
 */
export default function CourseManagementHeader(props: Props) {
    const [isMobileLayout, setIsMobileLayout] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileLayout(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <header className={`border-b border-gray-200 bg-white ${isMobileLayout ? "px-4 py-5" : "px-6 py-4"}`}>
            {isMobileLayout ? (
                <div className="flex flex-col gap-5">
                    <div>
                        <p className="text-sm font-semibold text-indigo-600">Teacher Tools</p>
                        <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Create, edit, and manage your courses and students.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={props.state.search}
                            onChange={(e) => props.actions.setSearch(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={props.refreshCourses}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                Refresh
                            </button>
                            <button
                                type="button"
                                onClick={props.openCreateModal}
                                className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                            >
                                + New Course
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-indigo-600">Teacher Tools</p>
                        <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Create, edit, and manage your courses and students.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={props.state.search}
                            onChange={(e) => props.actions.setSearch(e.target.value)}
                            className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                            type="button"
                            onClick={props.refreshCourses}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={props.openCreateModal}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                        >
                            + New Course
                        </button>
                    </div>
                </div>
            )}
        </header>
    )
}
