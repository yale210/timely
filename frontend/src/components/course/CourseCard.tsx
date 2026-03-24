import type { Course } from "@/types/course";

interface CourseCardProps {
  course: Course;
  onView: (course: Course) => void;
}

export default function CourseCard({ course, onView }: CourseCardProps) {
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
          <dd>{course.lead ?? "Unassigned"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-gray-500">Created</dt>
          <dd>{new Date(course.created_at).toLocaleString()}</dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleOpen();
          }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          View
        </button>
      </div>
    </article>
  );
}