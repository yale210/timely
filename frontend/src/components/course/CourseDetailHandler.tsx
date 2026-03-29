import type { CourseDetailState, CourseDetailConsts, CourseDetailHooks } from "@/types/course";

interface CourseHandlerProps {
    courseDetailState: CourseDetailState;
    courseDetailConsts: CourseDetailConsts;
    courseDetailHooks: CourseDetailHooks;
}

/**
 * Renders the course action buttons for managers and enrolled students.
 * @param props Component props.
 * @param props.courseDetailState Current state data in CourseDetail.
 * @param props.courseDetailConsts Const values from CourseDetail.
 * @param props.courseDetailHooks Hooks from CourseDetail used to open modals.
 */
export default function CourseDetailHandler({
    courseDetailState,
    courseDetailConsts,
    courseDetailHooks
}: CourseHandlerProps){
    return (
        <div className="flex flex-wrap gap-3">
            {courseDetailHooks.canManageCourse ? (
            <>
                <button
                type="button"
                onClick={courseDetailHooks.openJoinCodeModal}
                className="rounded-md border border-emerald-600 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                >
                Create join code
                </button>

                <button
                type="button"
                onClick={courseDetailHooks.openEventModal}
                className="rounded-md border border-indigo-600 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
                >
                Add event
                </button>

                <button
                type="button"
                onClick={courseDetailHooks.openEditModal}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                Edit course
                </button>
            </>
            ) : (
            courseDetailConsts.currentUser &&
            !courseDetailConsts.currentUser.is_admin && (
                <button
                type="button"
                onClick={() => void courseDetailHooks.handleLeaveCourse()}
                disabled={courseDetailState.leaveLoading}
                className="rounded-md border border-red-600 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                {courseDetailState.leaveLoading ? "Leaving..." : "Leave course"}
                </button>
            )
            )}
        </div>
    )
}