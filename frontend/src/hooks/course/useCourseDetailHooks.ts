import { useMemo, useEffect } from "react";
import type { CourseDetailState, CourseDetailConsts } from "@/types/course";
import type { User } from "@/types";
import type { Course } from "@/types/course";
import { timezoneDateTimeLocalToIso } from "@/utils/userTimezone";
import { getUsernameById } from "@/services/authService.ts";
import * as courseService from "@/services/courseService";

function useCanManageCourse(courseDetailState: CourseDetailState, currentUser: User | null){
    const canManageCourse = useMemo(() => {
        if (!courseDetailState.course) {
        return false;
        }

        return courseDetailState.course.lead == currentUser?.id?.toString() || currentUser?.is_admin === true;
    }, [courseDetailState.course, currentUser?.is_admin, currentUser?.id]);
    return canManageCourse;
}

function makeRefreshEvents(
    setEventsLoading: CourseDetailState["setEventsLoading"],
    setEvents: CourseDetailState["setEvents"],
){
    return async (courseId: number) => {
        setEventsLoading(true);
        try {
            const courseEvents = await courseService.getCourseEvents(courseId);
            setEvents(courseEvents);
        } catch (eventsError) {
            console.error(eventsError);
            setEvents([]);
        } finally {
            setEventsLoading(false);
        }
    };
}

/**
 * Helper functions for useLoadCourseEffect
 * @param id A course's id pre-validation.
 */
function getValidCourseId(id: string | undefined): number | null {
    const courseId = Number(id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
        return null;
    }

    return courseId;
}
function handleInvalidCourse(
    setError: CourseDetailState["setError"],
    setLoading: CourseDetailState["setLoading"],
): void {
    setError("Invalid course.");
    setLoading(false);
}
async function applyCourseState(
    setCourse: CourseDetailState["setCourse"],
    setLeadUsername: CourseDetailState["setLeadUsername"],
    setEditForm: CourseDetailState["setEditForm"],
    setEvents: CourseDetailState["setEvents"],
    courseData: Course,
    courseId: number,
): Promise<void> {
    setCourse(courseData);
    setLeadUsername(await getLeadLabel(courseData.lead));
    setEditForm({
        name: courseData.name,
        description: courseData.description,
        active: courseData.active !== false,
    });

    try {
        const courseEvents = await courseService.getCourseEvents(courseId);
        setEvents(courseEvents);
    } catch (eventsError) {
        console.error(eventsError);
        setEvents([]);
    }
}
function beginCourseLoad(
    setLoading: CourseDetailState["setLoading"],
    setError: CourseDetailState["setError"],
): void {
    setLoading(true);
    setError(null);
}
function handleCourseLoadError(
    setError: CourseDetailState["setError"],
    error: unknown,
): void {
    console.error(error);
    setError("Course not found.");
}
async function loadCourse(
    courseId: number,
    setCourse: CourseDetailState["setCourse"],
    setLeadUsername: CourseDetailState["setLeadUsername"],
    setEditForm: CourseDetailState["setEditForm"],
    setEvents: CourseDetailState["setEvents"],
    setLoading: CourseDetailState["setLoading"],
    setError: CourseDetailState["setError"],
): Promise<void> {
    beginCourseLoad(setLoading, setError);

    try {
        const courseData = await courseService.getCourse(courseId);
        await applyCourseState(
            setCourse,
            setLeadUsername,
            setEditForm,
            setEvents,
            courseData,
            courseId,
        );
    } catch (error) {
        handleCourseLoadError(setError, error);
    } finally {
        setLoading(false);
    }
}

function useLoadCourseEffect(
    id: string | undefined,
    setCourse: CourseDetailState["setCourse"],
    setLeadUsername: CourseDetailState["setLeadUsername"],
    setEditForm: CourseDetailState["setEditForm"],
    setEvents: CourseDetailState["setEvents"],
    setLoading: CourseDetailState["setLoading"],
    setError: CourseDetailState["setError"],
): void {
    useEffect(() => {
        const courseId = getValidCourseId(id);

        if (courseId === null) {
            handleInvalidCourse(setError, setLoading);
            return;
        }

        void loadCourse(
            courseId,
            setCourse,
            setLeadUsername,
            setEditForm,
            setEvents,
            setLoading,
            setError,
        );
    }, [id, setCourse, setLeadUsername, setEditForm, setEvents, setLoading, setError]);
}

function toIsoString(value: string){
    const isoValue = timezoneDateTimeLocalToIso(value);
    return isoValue || value;
};

function makeOpenEditModal(courseDetailState: CourseDetailState){
    return () => {
        courseDetailState.setEditError(null);
        courseDetailState.setEditOpen(true);
    };
}

function makeOpenEventModal(courseDetailState: CourseDetailState){
    return () => {
        courseDetailState.setEventError(null);
        courseDetailState.setEventOpen(true);
    };
}

function makeOpenJoinCodeModal(courseDetailState: CourseDetailState){
    return () => {
        courseDetailState.setJoinCodeError(null);
        courseDetailState.setJoinCodeOpen(true);
    };
}

async function getLeadLabel(lead: string | null | undefined): Promise<string>{
  if (!lead) {
    return "Unassigned";
  }

  try {
    return await getUsernameById(Number(lead));
  } catch {
    return lead;
  }
};

function makeHandleSaveCourse(courseDetailState: CourseDetailState){
    return async () => {
        if (!courseDetailState.course) return;

        courseDetailState.setEditError(null);
        courseDetailState.setEditSaving(true);

        try {
        const updated = await courseService.updateCourse(courseDetailState.course.id, {
            name: courseDetailState.editForm.name.trim(),
            description: courseDetailState.editForm.description,
            active: courseDetailState.editForm.active,
        });

        courseDetailState.setCourse(updated);
        courseDetailState.setEditOpen(false);
        } catch (saveError) {
        console.error(saveError);
        courseDetailState.setEditError("Unable to save changes.");
        } finally {
        courseDetailState.setEditSaving(false);
        }
    };
}

function makeHandleCreateEvent(courseDetailState: CourseDetailState){
    return async () => {
        if (!courseDetailState.course) return;
        courseDetailState.setEventError(null);
        courseDetailState.setEventSaving(true);
        try {
        await courseService.createCourseEvent(courseDetailState.course.id, {
            title: courseDetailState.eventForm.title.trim(),
            description: courseDetailState.eventForm.description,
            location: courseDetailState.eventForm.location,
            start_time: toIsoString(courseDetailState.eventForm.start_time),
            end_time: toIsoString(courseDetailState.eventForm.end_time),
        });
        const refreshEvents = makeRefreshEvents(
            courseDetailState.setEventsLoading,
            courseDetailState.setEvents,
        );
        await refreshEvents(courseDetailState.course.id);
        courseDetailState.setEventOpen(false);
        courseDetailState.setEventForm({title: "", description: "", location: "", start_time: "", end_time: ""});
        } catch (createError) {
            console.error(createError);
            courseDetailState.setEventError("Unable to create event.");
        } finally {
            courseDetailState.setEventSaving(false);
        }
    };
}

function makeHandleCreateJoinCode(courseDetailState: CourseDetailState){
    return async () => {
        if (!courseDetailState.course) return;

        courseDetailState.setJoinCodeError(null);
        courseDetailState.setJoinCodeResult(null);
        courseDetailState.setJoinCodeSaving(true);

        try {
        const result = await courseService.createJoinCode(courseDetailState.course.id, {
            expires_at: courseDetailState.joinCodeForm.expires_at ? toIsoString(courseDetailState.joinCodeForm.expires_at) : null,
        });

        courseDetailState.setJoinCodeResult(result.code);
        courseDetailState.setJoinCodeOpen(false);
        courseDetailState.setJoinCodeForm({ expires_at: "" });
        } catch (joinCodeCreateError) {
            console.error(joinCodeCreateError);
            courseDetailState.setJoinCodeError("Unable to create join code.");
        } finally {
        courseDetailState.setJoinCodeSaving(false);
        }
    };
}

function makeHandleLeaveCourse(courseDetailState: CourseDetailState, courseDetailConsts : CourseDetailConsts){
    return async () => {
        if (!courseDetailState.course) return;

        courseDetailState.setLeaveError(null);
        courseDetailState.setLeaveLoading(true);

        try {
            await courseService.leaveCourse(courseDetailState.course.id);
            void courseDetailConsts.navigate("/courses", { replace: true });
        } catch (leaveCourseError) {
            console.error(leaveCourseError);
            courseDetailState.setLeaveError("Unable to leave the course.");
        } finally {
            courseDetailState.setLeaveLoading(false);
        }
    };
}

/**
 * Returns a useMemo, useEffect, and other functions used by the CourseDetail page.
 * @param courseDetailState A generic type representing all states in CourseDetail that could possibly be used.
 * @param courseDetailConsts A generic type representing all consts used by CourseDetail to derive these hooks.
 * @returns An object containing all the methods required by CourseDetail.tsx
 */
export function useCourseDetailHooks(
    courseDetailState: CourseDetailState,
    courseDetailConsts: CourseDetailConsts,
) {
    const canManageCourse = useCanManageCourse(courseDetailState, courseDetailConsts.currentUser);
    const refreshEvents = makeRefreshEvents(
        courseDetailState.setEventsLoading,
        courseDetailState.setEvents,
    );
    useLoadCourseEffect(
        courseDetailConsts.id,
        courseDetailState.setCourse,
        courseDetailState.setLeadUsername,
        courseDetailState.setEditForm,
        courseDetailState.setEvents,
        courseDetailState.setLoading,
        courseDetailState.setError,
    );
    const openEditModal = makeOpenEditModal(courseDetailState);
    const openEventModal = makeOpenEventModal(courseDetailState);
    const openJoinCodeModal = makeOpenJoinCodeModal(courseDetailState);
    const handleSaveCourse = makeHandleSaveCourse(courseDetailState);
    const handleCreateEvent = makeHandleCreateEvent(courseDetailState);
    const handleCreateJoinCode = makeHandleCreateJoinCode(courseDetailState);
    const handleLeaveCourse = makeHandleLeaveCourse(courseDetailState, courseDetailConsts);

    return {
        canManageCourse,
        refreshEvents,
        openEditModal,
        openEventModal,
        openJoinCodeModal,
        handleSaveCourse,
        handleCreateEvent,
        handleCreateJoinCode,
        handleLeaveCourse,
        toIsoString,
    };
}