import { useEffect, useState } from "react";
import type { Course } from "@/types/course";
import { getUsernameById } from "@/services/authService";
import type {CoursePermissions} from "@/types/course.ts";
import { formatDateTimeInTimezone } from "@/utils/userTimezone";

interface CourseCardProps {
  course: Course;
  permission: CoursePermissions;
  onView: (course: Course) => void;
}

/**
 * Represents a card component for displaying course information and providing actions based on user permissions.
 * @param props - The props for the CourseCard component.
 * @param props.course - The course data to display.
 * @param [props.permission] - The permissions object defining user capabilities.
 * @param props.onView - Callback function executed when the course is opened or managed.
 * @returns The rendered CourseCard component.
 */
export default function CourseCard({ course, permission, onView }: CourseCardProps) {
  const [leadUsername, setLeadUsername] = useState<string>("Loading...");

  useEffect(() => {
    let isMounted = true;

    const loadLeadUsername = async () => {
      if (!course.lead) {
        if (isMounted) setLeadUsername("Unassigned");
        return;
      }

      try {
        const username = await getUsernameById(Number(course.lead));
        if (isMounted) setLeadUsername(username);
      } catch {
        if (isMounted) setLeadUsername(course.lead);
      }
    };

    void loadLeadUsername();

    return () => {
      isMounted = false;
    };
  }, [course.lead]);

  const handleOpen = () => onView(course);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-black">{course.name}</h3>

          <p className="mt-1 text-sm text-gray-600">{course.description}</p>
        </div>
      </div>

      <dl className="mt-4 space-y-2 text-sm text-gray-600">
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-gray-500">Lead</dt>
          <dd>{leadUsername}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-gray-500">Created</dt>
          <dd>{formatDateTimeInTimezone(course.created_at)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        {permission?.can_view_course_details && !permission?.can_manage_staff && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleOpen();
            }}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            View
          </button>
        )}
        {permission?.can_manage_staff && (
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            onClick={() => onView(course)}
          >
            Manage course
          </button>
        )}
      </div>
    </article>
  );
}
