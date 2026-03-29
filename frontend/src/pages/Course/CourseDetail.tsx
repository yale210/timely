import { Link } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout.tsx";
import CourseEventsCalendar from "@/components/course/CourseEventsCalendar.tsx";
import { formatDateTimeInTimezone } from "@/utils/userTimezone";
import { useCourseDetailStates } from "@/hooks/course/useCourseDetail";
import { useCourseDetailConsts } from "@/hooks/course/useCourseDetailConsts";
import { useCourseDetailHooks } from "@/hooks/course/useCourseDetailHooks";
import CourseDetailHandler from "@/components/course/CourseDetailHandler";

/**
 * Renders a single course detail page.
 */
export default function CourseDetail() {
  const courseDetailState = useCourseDetailStates();
  const courseDetailConsts = useCourseDetailConsts();
  const courseDetailHooks = useCourseDetailHooks(courseDetailState, courseDetailConsts);

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-5xl px-6 py-6">
        <div className="mb-6">
          <Link to="/courses" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            ← Back to courses
          </Link>
        </div>

        {courseDetailState.loading && <p className="text-sm text-gray-500">Loading course...</p>}
        {courseDetailState.error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{courseDetailState.error}</div>}
        {courseDetailState.leaveError && (
          <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {courseDetailState.leaveError}
          </div>
        )}

        {courseDetailState.course && !courseDetailState.error && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{courseDetailState.course.name}</h1>
                  <p className="mt-2 text-gray-600">{courseDetailState.course.description}</p>
                </div>

                <CourseDetailHandler
                  courseDetailState={courseDetailState}
                  courseDetailConsts={courseDetailConsts}
                  courseDetailHooks={courseDetailHooks}
                />
              </div>

              {courseDetailState.joinCodeResult && (
                <div className="mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Join code created: <span className="font-semibold">{courseDetailState.joinCodeResult}</span>
                </div>
              )}

              <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lead</dt>
                  <dd className="mt-1 text-sm text-gray-900">{courseDetailState.leadUsername ?? "Loading..."}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDateTimeInTimezone(courseDetailState.course.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {courseDetailState.course.active === false ? "Inactive" : "Active"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <CourseEventsCalendar courseName={courseDetailState.course.name} events={courseDetailState.events} inline />
              {courseDetailState.eventsLoading && (
                <div className="border-t border-gray-200 px-6 py-3 text-sm text-gray-500">
                  Loading events...
                </div>
              )}
            </section>
          </div>
        )}

        {courseDetailState.joinCodeOpen && courseDetailState.course && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <button
              type="button"
              aria-label="Close join code modal backdrop"
              onClick={() => courseDetailState.setJoinCodeOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Create join code</h2>
              <p className="mt-1 text-sm text-gray-500">Generate a new code for this course.</p>

              {courseDetailState.joinCodeError && (
                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {courseDetailState.joinCodeError}
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
                    value={courseDetailState.joinCodeForm.expires_at}
                    onChange={(event) =>
                      courseDetailState.setJoinCodeForm((prev) => ({ ...prev, expires_at: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => courseDetailState.setJoinCodeOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void courseDetailHooks.handleCreateJoinCode()}
                  disabled={courseDetailState.joinCodeSaving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {courseDetailState.joinCodeSaving ? "Creating..." : "Create code"}
                </button>
              </div>
            </div>
          </div>
        )}

        {courseDetailState.editOpen && courseDetailState.course && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <button
              type="button"
              aria-label="Close edit modal backdrop"
              onClick={() => courseDetailState.setEditOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Edit course</h2>
              <p className="mt-1 text-sm text-gray-500">Update the course details.</p>

              {courseDetailState.editError && (
                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {courseDetailState.editError}
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
                    value={courseDetailState.editForm.name}
                    onChange={(event) =>
                      courseDetailState.setEditForm((prev) => ({ ...prev, name: event.target.value }))
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
                    value={courseDetailState.editForm.description}
                    onChange={(event) =>
                      courseDetailState.setEditForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={courseDetailState.editForm.active}
                    onChange={(event) =>
                      courseDetailState.setEditForm((prev) => ({ ...prev, active: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Active course
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => courseDetailState.setEditOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void courseDetailHooks.handleSaveCourse()}
                  disabled={courseDetailState.editSaving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {courseDetailState.editSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {courseDetailState.eventOpen && courseDetailState.course && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <button
              type="button"
              aria-label="Close event modal backdrop"
              onClick={() => courseDetailState.setEventOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Add course event</h2>
              <p className="mt-1 text-sm text-gray-500">Create a new event for this course.</p>

              {courseDetailState.eventError && (
                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {courseDetailState.eventError}
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
                    value={courseDetailState.eventForm.title}
                    onChange={(event) =>
                      courseDetailState.setEventForm((prev) => ({ ...prev, title: event.target.value }))
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
                    value={courseDetailState.eventForm.description}
                    onChange={(event) =>
                      courseDetailState.setEventForm((prev) => ({ ...prev, description: event.target.value }))
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
                    value={courseDetailState.eventForm.location}
                    onChange={(event) =>
                      courseDetailState.setEventForm((prev) => ({ ...prev, location: event.target.value }))
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
                      value={courseDetailState.eventForm.start_time}
                      onChange={(event) =>
                        courseDetailState.setEventForm((prev) => ({ ...prev, start_time: event.target.value }))
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
                      value={courseDetailState.eventForm.end_time}
                      onChange={(event) =>
                        courseDetailState.setEventForm((prev) => ({ ...prev, end_time: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => courseDetailState.setEventOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void courseDetailHooks.handleCreateEvent()}
                  disabled={courseDetailState.eventSaving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {courseDetailState.eventSaving ? "Creating..." : "Create event"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
