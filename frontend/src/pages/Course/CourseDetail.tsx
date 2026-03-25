import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout.tsx";
import CourseEventsCalendar from "@/components/course/CourseEventsCalendar.tsx";
import { authStore } from "@/services/authService";
import * as courseService from "@/services/courseService";
import type { Course } from "@/types/course.ts";
import type { Event } from "@/types/event.ts";

interface CourseEditForm {
  name: string;
  description: string;
  active: boolean;
}

interface CourseEventForm {
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
}

interface CourseJoinCodeForm {
  expires_at: string;
}

/**
 * Renders a single course detail page.
 */
export default function CourseDetail() {
  const { id } = useParams();
  const currentUser = authStore.getUser();

  const [course, setCourse] = useState<Course | null>(null);
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
  const [eventForm, setEventForm] = useState<CourseEventForm>({
    title: "",
    description: "",
    location: "",
    start_time: "",
    end_time: "",
  });

  const [joinCodeOpen, setJoinCodeOpen] = useState(false);
  const [joinCodeSaving, setJoinCodeSaving] = useState(false);
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null);
  const [joinCodeResult, setJoinCodeResult] = useState<string | null>(null);
  const [joinCodeForm, setJoinCodeForm] = useState<CourseJoinCodeForm>({
    expires_at: "",
  });

   const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const canEditCourse = useMemo(() => {
    if (!course) {
      return false;
    }

    return course.lead == currentUser?.id?.toString() || currentUser?.is_admin === true;
  }, [course, currentUser?.is_admin, currentUser?.id]);

  const canAddCourseEvent = useMemo(() => {
    if (!course) {
      return false;
    }

    return course.lead == currentUser?.id?.toString() || currentUser?.is_admin === true;
  }, [course, currentUser?.is_admin, currentUser?.id]);

  const canCreateJoinCode = useMemo(() => {
    if (!course) {
      return false;
    }

    return course.lead == currentUser?.id?.toString() || currentUser?.is_admin === true;
  }, [course, currentUser?.is_admin, currentUser?.id]);

  const refreshEvents = async (courseId: number) => {
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

  const toIsoString = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  };

  useEffect(() => {
    const courseId = Number(id);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      setError("Invalid course.");
      setLoading(false);
      return;
    }

    const loadCourse = async () => {
      setLoading(true);
      setError(null);

      try {
        const courseData = await courseService.getCourse(courseId);
        setCourse(courseData);
        setEditForm({
          name: courseData.name,
          description: courseData.description,
          active: courseData.active !== false,
        });

        await refreshEvents(courseId);
      } catch (courseError) {
        console.error(courseError);
        setError("Course not found.");
      } finally {
        setLoading(false);
      }
    };

    void loadCourse();
  }, [id]);

  const handleSaveCourse = async () => {
    if (!course) return;

    setEditError(null);
    setEditSaving(true);

    try {
      const updated = await courseService.updateCourse(course.id, {
        name: editForm.name.trim(),
        description: editForm.description,
        active: editForm.active,
      });

      setCourse(updated);
      setEditOpen(false);
    } catch (saveError) {
      console.error(saveError);
      setEditError("Unable to save changes.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!course) return;

    setEventError(null);
    setEventSaving(true);

    try {
      await courseService.createCourseEvent(course.id, {
        title: eventForm.title.trim(),
        description: eventForm.description,
        location: eventForm.location,
        start_time: toIsoString(eventForm.start_time),
        end_time: toIsoString(eventForm.end_time),
      });

      await refreshEvents(course.id);
      setEventOpen(false);
      setEventForm({
        title: "",
        description: "",
        location: "",
        start_time: "",
        end_time: "",
      });
    } catch (createError) {
      console.error(createError);
      setEventError("Unable to create event.");
    } finally {
      setEventSaving(false);
    }
  };

  const handleCreateJoinCode = async () => {
    if (!course) return;

    setJoinCodeError(null);
    setJoinCodeResult(null);
    setJoinCodeSaving(true);

    try {
      const result = await courseService.createJoinCode(course.id, {
        expires_at: joinCodeForm.expires_at ? toIsoString(joinCodeForm.expires_at) : null,
      });
      setJoinCodeResult(result.code);
      setJoinCodeOpen(false);
      setJoinCodeForm({ expires_at: "" });
    } catch (joinCodeCreateError) {
      console.error(joinCodeCreateError);
      setJoinCodeError("Unable to create join code.");
    } finally {
      setJoinCodeSaving(false);
    }
  };

   const handleLeaveCourse = async () => {
    if (!course) return;

    setLeaveError(null);
    setLeaveLoading(true);

    try {
      await courseService.leaveCourse(course.id);
      void navigate("/courses", { replace: true });
    } catch (leaveCourseError) {
      console.error(leaveCourseError);
      setLeaveError("Unable to leave the course.");
    } finally {
      setLeaveLoading(false);
    }
  };

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-5xl px-6 py-6">
        <div className="mb-6">
          <Link to="/courses" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            ← Back to courses
          </Link>
        </div>

        {loading && <p className="text-sm text-gray-500">Loading course...</p>}
        {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {course && !error && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{course.name}</h1>
                  <p className="mt-2 text-gray-600">{course.description}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {canCreateJoinCode && (
                    <button
                      type="button"
                      onClick={() => {
                        setJoinCodeError(null);
                        setJoinCodeOpen(true);
                      }}
                      className="rounded-md border border-emerald-600 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                    >
                      Create join code
                    </button>
                  )}

                  {canAddCourseEvent && (
                    <button
                      type="button"
                      onClick={() => {
                        setEventError(null);
                        setEventOpen(true);
                      }}
                      className="rounded-md border border-indigo-600 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
                    >
                      Add event
                    </button>
                  )}

                  {canEditCourse && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditError(null);
                        setEditOpen(true);
                      }}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Edit course
                    </button>
                  )}
                  {currentUser && (!canEditCourse && !currentUser.is_admin) && (
                  <button
                    type="button"
                    onClick={() => void handleLeaveCourse()}
                    disabled={leaveLoading}
                    className="rounded-md border border-red-600 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {leaveLoading ? "Leaving..." : "Leave course"}
                  </button>

                    )}
                </div>
              </div>

              {joinCodeResult && (
                <div className="mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Join code created: <span className="font-semibold">{joinCodeResult}</span>
                </div>
              )}

              <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lead</dt>
                  <dd className="mt-1 text-sm text-gray-900">{course.lead ?? "Unassigned"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(course.created_at).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {course.active === false ? "Inactive" : "Active"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <CourseEventsCalendar courseName={course.name} events={events} inline />
              {eventsLoading && (
                <div className="border-t border-gray-200 px-6 py-3 text-sm text-gray-500">
                  Loading events...
                </div>
              )}
            </section>
          </div>
        )}

        {joinCodeOpen && course && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <button
              type="button"
              aria-label="Close join code modal backdrop"
              onClick={() => setJoinCodeOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Create join code</h2>
              <p className="mt-1 text-sm text-gray-500">Generate a new code for this course.</p>

              {joinCodeError && (
                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {joinCodeError}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="join-code-expires-at"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Expires at
                  </label>
                  <input
                    id="join-code-expires-at"
                    type="datetime-local"
                    value={joinCodeForm.expires_at}
                    onChange={(event) =>
                      setJoinCodeForm((prev) => ({ ...prev, expires_at: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setJoinCodeOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateJoinCode()}
                  disabled={joinCodeSaving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {joinCodeSaving ? "Creating..." : "Create code"}
                </button>
              </div>
            </div>
          </div>
        )}

        {editOpen && course && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <button
              type="button"
              aria-label="Close edit modal backdrop"
              onClick={() => setEditOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Edit course</h2>
              <p className="mt-1 text-sm text-gray-500">Update the course details.</p>

              {editError && (
                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {editError}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="course-name" className="block text-sm font-medium text-gray-700">
                    Course name
                  </label>
                  <input
                    id="course-name"
                    type="text"
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="course-description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="course-description"
                    rows={4}
                    value={editForm.description}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editForm.active}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, active: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Active course
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveCourse()}
                  disabled={editSaving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {eventOpen && course && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <button
              type="button"
              aria-label="Close event modal backdrop"
              onClick={() => setEventOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Add course event</h2>
              <p className="mt-1 text-sm text-gray-500">Create a new event for this course.</p>

              {eventError && (
                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {eventError}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="event-title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    id="event-title"
                    type="text"
                    value={eventForm.title}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="event-description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="event-description"
                    rows={3}
                    value={eventForm.description}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="event-location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    id="event-location"
                    type="text"
                    value={eventForm.location}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, location: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="event-start-time"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Start time
                    </label>
                    <input
                      id="event-start-time"
                      type="datetime-local"
                      value={eventForm.start_time}
                      onChange={(event) =>
                        setEventForm((prev) => ({ ...prev, start_time: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="event-end-time"
                      className="block text-sm font-medium text-gray-700"
                    >
                      End time
                    </label>
                    <input
                      id="event-end-time"
                      type="datetime-local"
                      value={eventForm.end_time}
                      onChange={(event) =>
                        setEventForm((prev) => ({ ...prev, end_time: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEventOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateEvent()}
                  disabled={eventSaving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {eventSaving ? "Creating..." : "Create event"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}