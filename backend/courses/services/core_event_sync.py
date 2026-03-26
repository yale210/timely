from typing import Dict, Any

from core.models import Event
from courses.services.event import logger, User


class CourseEventSyncService:
    """Service to sync CourseEvent objects to core.models.Event.

    Handles synchronization for all enrolled students.
    """

    @staticmethod
    def sync_course_event_to_core(course_event) -> Dict[str, Any]:
        """Syncs a single CourseEvent to core.models.Event for all enrolled students.

        Args:
            course_event: CourseEvent instance to sync.

        Returns:
            Dictionary with sync statistics (created, updated, errors).
        """
        from courses.models import CourseEnrollment

        stats = {
            "created": 0,
            "updated": 0,
            "errors": [],
        }

        try:
            # Get all students enrolled in the course
            enrollments = CourseEnrollment.objects.filter(
                course=course_event.course, active=True
            ).select_related("student__user")

            if not enrollments.exists():
                logger.info(
                    f"No active enrollments for course {course_event.course.id}"
                )
                return stats

            for enrollment in enrollments:
                try:
                    user = enrollment.student.user
                    event_title = f"{course_event.course.name} - {course_event.title}"

                    # Check if event already exists
                    try:
                        core_event = Event.objects.get(
                            user=user,
                            title=event_title,
                            start_time=course_event.start_time,
                        )
                        # Update existing event
                        updated = False
                        if core_event.description != (course_event.description or ""):
                            core_event.description = course_event.description or ""
                            updated = True
                        if core_event.location != (course_event.location or ""):
                            core_event.location = course_event.location or ""
                            updated = True
                        if core_event.colour != course_event.colour:
                            core_event.colour = course_event.colour
                            updated = True
                        if core_event.end_time != course_event.end_time:
                            core_event.end_time = course_event.end_time
                            updated = True

                        if updated:
                            # Save without validation to avoid recurrence errors
                            core_event.save(
                                update_fields=[
                                    "description",
                                    "location",
                                    "colour",
                                    "end_time",
                                ]
                            )
                            stats["updated"] += 1
                            logger.info(
                                f"Updated Event {core_event.id} for user {user.username}"
                            )
                    except Event.DoesNotExist:
                        # Create new event without validation
                        core_event = Event(
                            user=user,
                            title=event_title,
                            description=course_event.description or "",
                            location=course_event.location or "",
                            colour=course_event.colour,
                            start_time=course_event.start_time,
                            end_time=course_event.end_time,
                        )
                        # Save without full_clean() to avoid validation errors
                        core_event.save()
                        stats["created"] += 1
                        logger.info(
                            f"Created Event {core_event.id} for user {user.username}"
                        )

                except Exception as e:
                    error_msg = (
                        f"Failed to sync course_event {course_event.id} "
                        f"for user {enrollment.student.user.username}: {str(e)}"
                    )
                    logger.error(error_msg, exc_info=True)
                    stats["errors"].append(error_msg)

            logger.info(
                f"Course event sync completed for CourseEvent {course_event.id}. "
                f"Created: {stats['created']}, Updated: {stats['updated']}, "
                f"Errors: {len(stats['errors'])}"
            )

        except Exception as e:
            error_msg = f"Failed to sync course event {course_event.id}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            stats["errors"].append(error_msg)

        return stats

    @staticmethod
    def sync_user_course_events(user: User) -> Dict[str, Any]:
        """Syncs all CourseEvents for user's enrolled courses to core.models.Event.

        Args:
            user: User instance to sync events for.

        Returns:
            Dictionary with sync statistics.
        """
        from courses.models import CourseEnrollment, CourseEvent

        stats = {
            "created": 0,
            "updated": 0,
            "errors": [],
        }

        try:
            # Get all courses the user is enrolled in
            user_enrollments = CourseEnrollment.objects.filter(
                student__user=user, active=True
            ).select_related("course")

            if not user_enrollments.exists():
                logger.info(f"User {user.username} has no active course enrollments")
                return stats

            # Get course IDs
            course_ids = [enrollment.course.id for enrollment in user_enrollments]

            # Get all course events for enrolled courses
            course_events = CourseEvent.objects.filter(
                course__in=course_ids
            ).select_related("course")

            for course_event in course_events:
                try:
                    event_title = f"{course_event.course.name} - {course_event.title}"
                    event_description = (
                        f"{course_event.course.name} - {course_event.title}"
                        + "'\n"
                        + (course_event.description or "")
                        + "\n"
                        + "By "
                        + course_event.created_by.user.username
                    )
                    # Check if event already exists
                    try:
                        core_event = Event.objects.get(
                            user=user,
                            title=event_title,
                            start_time=course_event.start_time,
                        )
                        # Update if needed
                        updated = False
                        if core_event.description != (course_event.description or ""):
                            core_event.description = event_description
                            updated = True
                        if core_event.end_time != course_event.end_time:
                            core_event.end_time = course_event.end_time
                            updated = True

                        if updated:
                            core_event.save(update_fields=["description", "end_time"])
                            stats["updated"] += 1
                    except Event.DoesNotExist:
                        # Create new event
                        core_event = Event(
                            user=user,
                            title=event_title,
                            description=event_description,
                            location=course_event.location or "",
                            colour=course_event.colour,
                            start_time=course_event.start_time,
                            end_time=course_event.end_time,
                        )
                        core_event.save()
                        stats["created"] += 1

                except Exception as e:
                    error_msg = (
                        f"Failed to sync course_event {course_event.id} "
                        f"for user {user.username}: {str(e)}"
                    )
                    logger.error(error_msg, exc_info=True)
                    stats["errors"].append(error_msg)

            logger.info(
                f"User event sync completed for {user.username}. "
                f"Created: {stats['created']}, Updated: {stats['updated']}, "
                f"Errors: {len(stats['errors'])}"
            )

        except Exception as e:
            error_msg = f"Failed to sync user events for {user.username}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            stats["errors"].append(error_msg)

        return stats
