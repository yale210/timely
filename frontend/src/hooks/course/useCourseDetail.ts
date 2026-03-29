import type { Course, CourseEditForm, CourseEventForm, CourseJoinCodeForm } from "@/types/course";
import type { Event } from "@/types";
import { useState } from "react";

function useCourseDetailFirstState(){
    const [course, setCourse] = useState<Course | null>(null);
    const [leadUsername, setLeadUsername] = useState<string | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editOpen, setEditOpen] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<CourseEditForm>({
        name: "",
        description: "",
        active: true,
    });

    const [eventOpen, setEventOpen] = useState(false);
    const [eventSaving, setEventSaving] = useState(false);
    const [eventError, setEventError] = useState<string | null>(null);
    return {
        course, setCourse,
        leadUsername, setLeadUsername,
        events, setEvents,
        loading, setLoading,
        eventsLoading, setEventsLoading,
        error, setError,
        editOpen, setEditOpen,
        editSaving, setEditSaving,
        editError, setEditError,
        editForm, setEditForm,
        eventOpen, setEventOpen,
        eventSaving, setEventSaving,
        eventError, setEventError,
    }
}

function useCourseDetailSecondState(){
    const [eventForm, setEventForm] = useState<CourseEventForm>({
        title: "", description: "", location: "", start_time: "", end_time: ""
    });
    const [joinCodeOpen, setJoinCodeOpen] = useState(false);
    const [joinCodeSaving, setJoinCodeSaving] = useState(false);
    const [joinCodeError, setJoinCodeError] = useState<string | null>(null);
    const [joinCodeResult, setJoinCodeResult] = useState<string | null>(null);
    const [joinCodeForm, setJoinCodeForm] = useState<CourseJoinCodeForm>({expires_at: ""});
    const [leaveLoading, setLeaveLoading] = useState(false);
    const [leaveError, setLeaveError] = useState<string | null>(null);
    return {
        eventForm, setEventForm,
        joinCodeOpen, setJoinCodeOpen,
        joinCodeSaving, setJoinCodeSaving,
        joinCodeError, setJoinCodeError,
        joinCodeResult, setJoinCodeResult,
        joinCodeForm, setJoinCodeForm,
        leaveLoading, setLeaveLoading,
        leaveError, setLeaveError,
    }
}

/**
 * Creates and returns all local state used by the course detail page.
 */
export function useCourseDetailStates(){
    return {
        ...useCourseDetailFirstState(),
        ...useCourseDetailSecondState(),
    }
}