import { useState } from "react";
import type { Course, CourseStudent, CourseCreation, CourseUpdate } from "@/types/course";

/**
 * Creates and returns all local state used by the course management page.
 */
export function useCourseManagementState(){
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
    const [studentsTarget, setStudentsTarget] = useState<Course | null>(null);
    const [students, setStudents] = useState<CourseStudent[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [removingStudentId, setRemovingStudentId] = useState<number | null>(null);
    const [createForm, setCreateForm] = useState<CourseCreation>({
        name: "",
        description: "",
    });
    const [editForm, setEditForm] = useState<CourseUpdate>({
        name: "",
        description: "",
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createSucceeded, setCreateSucceeded] = useState(false);
    return {
        editingCourse, setEditingCourse,
        deleteTarget, setDeleteTarget,
        studentsTarget, setStudentsTarget,
        students, setStudents,
        studentsLoading, setStudentsLoading,
        removingStudentId, setRemovingStudentId,
        createForm, setCreateForm,
        editForm, setEditForm,
        formError, setFormError,
        isSubmitting, setIsSubmitting,
        showCreateModal, setShowCreateModal,
        createSucceeded, setCreateSucceeded,
    }
}