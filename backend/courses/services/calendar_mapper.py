from typing import Dict, Any


class CalendarEventMapper:
    """Maps CourseEvent objects to calendar provider format."""

    @staticmethod
    def to_calendar_event(course_event) -> Dict[str, Any]:
        """Converts a CourseEvent to a generic calendar event format.

        Args:
            course_event: CourseEvent model instance.

        Returns:
            Dictionary with calendar event data.
        """
        return {
            "title": f"{course_event.title}",
            "description": f"{course_event.course.name} + {course_event.title}"
            + "'\n"
            + (course_event.description or "")
            + "\n"
            + "By "
            + course_event.created_by.user.username,
            "location": getattr(course_event, "location", ""),
        }