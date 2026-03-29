import { useEffect, useMemo } from "react";
import type { CourseManagmentState, UseCoursesActions, Course } from "@/types/course";
import { getCourseStudents, removeUserFromCourse } from "@/services/courseService";

function makeOpenCreateModal(courseManagementState: CourseManagmentState) : () => void {
    return () => {
        courseManagementState.setFormError(null);
        courseManagementState.setCreateForm({ name: "", description: "" });
        courseManagementState.setShowCreateModal(true);
    }
};

function makeRefreshCourses(actions: UseCoursesActions) : () => void {
    return () =>{
        void actions.refresh();
    }
};
/**
 * Loads students for the currently selected course.
 * @param courseManagementState Course management state bundle.
 */
function useStudentLoadEffect(courseManagementState: CourseManagmentState): void {
    const { studentsTarget, setStudents, setStudentsLoading } = courseManagementState;

    useEffect(() => {
        if (!studentsTarget) {
            setStudents([]);
            return;
        }

        const loadStudents = async () => {
        setStudentsLoading(true);
        try {
            const data = await getCourseStudents(studentsTarget.id);
            setStudents(data);
        } catch (loadError) {
            console.error(loadError);
            setStudents([]);
        } finally {
            setStudentsLoading(false);
        }
        };

        void loadStudents();
    }, [studentsTarget, setStudents, setStudentsLoading]);
}

function useRefreshAfterCreate(
    createSucceeded: boolean,
    refresh: UseCoursesActions["refresh"],
    setCreateSucceeded: (value: boolean) => void,
): void {
    useEffect(() => {
        if (!createSucceeded) {
            return;
        }

        void refresh();
        setCreateSucceeded(false);
    }, [createSucceeded, refresh, setCreateSucceeded]);
}

function makeHandleCreate(
    courseManagementState: CourseManagmentState,
    actions: UseCoursesActions,
): () => Promise<void> {
    return async () => {
        if (!courseManagementState.createForm.name.trim()) {
            courseManagementState.setFormError("Course name is required.");
            return;
        }

        courseManagementState.setFormError(null);
        courseManagementState.setIsSubmitting(true);

        try {
            const result = await actions.createCourse(courseManagementState.createForm);

            if (result) {
                courseManagementState.setShowCreateModal(false);
                courseManagementState.setCreateForm({ name: "", description: "" });
                courseManagementState.setCreateSucceeded(true);
            }
        }
        finally {
            courseManagementState.setIsSubmitting(false);
        }
    };
}

function makeHandleUpdate(
  courseManagementState: CourseManagmentState,
  actions: UseCoursesActions,
): () => Promise<void> {
    return async () => {
        if (!courseManagementState.editingCourse) {
            return;
        }

        if (!courseManagementState.editForm.name?.trim()) {
            courseManagementState.setFormError("Course name is required.");
            return;
        }

        courseManagementState.setFormError(null);
        courseManagementState.setIsSubmitting(true);

        try {
            const result = await actions.updateCourse(
                courseManagementState.editingCourse.id,
                courseManagementState.editForm,
            );

        if (result) {
            courseManagementState.setEditingCourse(null);
            courseManagementState.setEditForm({ name: "", description: "" });
        }
        } finally {
            courseManagementState.setIsSubmitting(false);
        }
    };
}

function makeHandleDelete(
    courseManagementState: CourseManagmentState,
    actions: UseCoursesActions,
): () => Promise<void> {
    return async () => {
        if (!courseManagementState.deleteTarget) {
            return;
        }

        courseManagementState.setIsSubmitting(true);

        try {
            await actions.deleteCourse(courseManagementState.deleteTarget.id);
            courseManagementState.setDeleteTarget(null);
        } finally {
            courseManagementState.setIsSubmitting(false);
        }
    };
}

function useCourseCountText(managedFilteredCourses: Course[]): string {
    return useMemo(() => {
        const count = managedFilteredCourses.length;
        return count === 1 ? "1 course" : `${count} courses`;
    }, [managedFilteredCourses.length]);
}

/**
 * Opens the edit modal for a selected course and pre-fills the form.
 * @param courseManagementState All states used by CourseManagement as one object.
 * @param course The current course.
 */
export function openEditModal(
    courseManagementState: CourseManagmentState,
    course: Course,
): void {
    courseManagementState.setEditingCourse(course);
    courseManagementState.setEditForm({
        name: course.name,
        description: course.description,
    });
    courseManagementState.setFormError(null);
}

/**
 * Removes a student from the selected course and refreshes the list.
 * @param courseManagementState All states used by CourseManagement as one object.
 * @param actions Actions that can be called on the courses.
 */
export function makeHandleRemoveStudent(
    courseManagementState: CourseManagmentState,
    actions: UseCoursesActions,
): (studentId: number) => Promise<void> {
    return async (studentId: number) => {
        if (!courseManagementState.studentsTarget) {
            return;
        }

        courseManagementState.setRemovingStudentId(studentId);

        try {
            await removeUserFromCourse(courseManagementState.studentsTarget.id, studentId);
            const refreshedStudents = await getCourseStudents(courseManagementState.studentsTarget.id);
            courseManagementState.setStudents(refreshedStudents);
            await actions.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            courseManagementState.setRemovingStudentId(null);
        }
    };
}

/**
 * Returns bound handlers and derived values for the course management page.
 * @param courseManagementState All states used by CourseManagement as one object.
 * @param actions Actions called on coruses.
 * @param managedFilteredCourses A list of courses managed by the user.
 */
export function useCourseManagementHooks(
    courseManagementState: CourseManagmentState,
    actions: UseCoursesActions,
    managedFilteredCourses: Course[],
) {
    useStudentLoadEffect(courseManagementState);
    useRefreshAfterCreate(
        courseManagementState.createSucceeded,
        actions.refresh,
        courseManagementState.setCreateSucceeded,
    );

    const openCreateModal = makeOpenCreateModal(courseManagementState);
    const refreshCourses = makeRefreshCourses(actions);
    const handleCreate = makeHandleCreate(courseManagementState, actions);
    const handleUpdate = makeHandleUpdate(courseManagementState, actions);
    const handleDelete = makeHandleDelete(courseManagementState, actions);
    const handleRemoveStudent = makeHandleRemoveStudent(courseManagementState, actions);
    const courseCountText = useCourseCountText(managedFilteredCourses);

    return {
        openCreateModal,
        refreshCourses,
        handleCreate,
        handleUpdate,
        handleDelete,
        handleRemoveStudent,
        courseCountText,
    };
}