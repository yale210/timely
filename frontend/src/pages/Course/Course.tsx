import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout.tsx";
import CoursesEmptyState from "@/components/course/CourseEmptyState.tsx";
import CourseCard from "@/components/course/CourseCard.tsx";
import CoursesHeader from "@/components/course/CourseHeader.tsx";
import CourseEventsDrawer from "@/components/course/CourseEventsDrawer.tsx";
import { useCourses } from "@/hooks/course/useCourse.tsx";
import { useCoursePermissions } from "@/hooks/course/useCoursePermissions.tsx";
import * as courseService from "@/services/courseService";
import type { Course } from "@/types/course.ts";
import type { Event } from "@/types/event.ts";
import { useTeacher } from "@/hooks/course/useTeacher.tsx";
import {CoursePeED} from "@/types/coursePermissions.ts";
function CourseCardWithPermissions({
  course,
  onView,
}: {
  course: Course;
  onView: (course: Course) => void;
}) {
  const { permissions, loading: permissionsLoading } = useCoursePermissions(course.id);

  return (
    <CourseCard
      course={course}
      onView={onView}
      permission={permissionsLoading ? new CoursePeED().options : permissions}
    />
  );
}

/**
 * Renders the courses page.
 */
export default function Courses() {
  const navigate = useNavigate();
  const { isTeacher } = useTeacher();
  const { state, filteredCourses, loading, error, actions } = useCourses();

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseEvents, setCourseEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [joinCourseId, setJoinCourseId] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCourse) {
      setCourseEvents([]);
      return;
    }

    const loadCourseEvents = async () => {
      setEventsLoading(true);
      try {
        const events = await courseService.getCourseEvents(selectedCourse.id);
        setCourseEvents(events);
      } catch (loadError) {
        console.error(loadError);
        setCourseEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    void loadCourseEvents();
  }, [selectedCourse]);

  const clearJoinError = () => {
    setJoinError(null);
  };

  const handleJoinCourse = async () => {
    clearJoinError();

    const courseId = joinCourseId.trim();
    if (!courseId) {
      setJoinError("Please enter a valid course ID.");
        return;
      }

          try {
      const joinedCourse = await actions.joinCourse(courseId);
      if (!joinedCourse) {
        setJoinError("Unable to join that course.");
        return;
          }

      setJoinCourseId("");
      await actions.refresh();
    } catch (joinCourseError) {
      console.error(joinCourseError);
      setJoinError("Unable to join that course.");
    }
    };

  return (
    <AppLayout>
      <CoursesHeader
        search={state.search}
        joinCourseId={joinCourseId}
        onSearchChange={actions.setSearch}
        onJoinCourseIdChange={(value) => {
          setJoinCourseId(value);
          if (joinError) {
            clearJoinError();
          }
        }}
        onJoinCourse={() => void handleJoinCourse()}
        onRefresh={() => void actions.refresh()}
        isTeacher={isTeacher}
        onManageCourses={() => void navigate("/courses/manage")}
      />

      {joinError && (
        <div className="px-6 pt-3">
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {joinError}
          </div>
              </div>
      )}

      <main className="flex-1 overflow-y-auto bg-white px-6 py-4">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && filteredCourses.length === 0 && (
          <p className="mb-4 text-sm text-gray-500">Loading courses...</p>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCardWithPermissions
              key={course.id}
              course={course}
              onView={(courseToOpen) => {
                setSelectedCourse(courseToOpen);
                void navigate(`/courses/${courseToOpen.id}`);
              }}
            />
          ))}
        </div>

        {filteredCourses.length === 0 && !loading && <CoursesEmptyState />}

        {selectedCourse && (
          <CourseEventsDrawer
            courseName={selectedCourse.name}
            events={courseEvents}
            loading={eventsLoading}
            onClose={() => setSelectedCourse(null)}
          />
        )}
      </main>
    </AppLayout>
  );
}