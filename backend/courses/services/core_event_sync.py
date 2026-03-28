from typing import Dict, Any

from core.models import Event
from courses.services.event import logger, User


class CourseEventSyncService:
    """Service to sync CourseEvent objects to core.models.Event.

    Handles synchronization for all enrolled students.
    """

    @staticmethod
    def _new_stats() -> Dict[str, Any]:
        # Track sync outcome across the whole operation.
        return {
            "created": 0,
            "updated": 0,
            "errors": [],
        }

    @staticmethod
    def _course_event_title(course_event) -> str:
        # Build a consistent title used to match core events.
        return f"{course_event.course.name} - {course_event.title}"

    @staticmethod
    def _course_event_description(course_event) -> str:
        # Include course, title, description, and creator in the synced description.
        return (
            f"{course_event.course.name} - {course_event.title}"
            + "'\n"
            + (course_event.description or "")
            + "\n"
            + "By "
            + course_event.created_by.user.username
        )

    @staticmethod
    def _get_core_event(user, title: str, start_time):
        # Look up the target calendar event using the stable identity fields.
        return Event.objects.get(
            user=user,
            title=title,
            start_time=start_time,
        )

    @staticmethod
    def _create_core_event_for_course_student(course_event, user):
        # Create a new core event copy for a specific enrolled student.
        core_event = Event(
            user=user,
            title=CourseEventSyncService._course_event_title(course_event),
            description=course_event.description or "",
            location=course_event.location or "",
            colour=course_event.colour,
            start_time=course_event.start_time,
            end_time=course_event.end_time,
        )
        core_event.save()
        return core_event

    @staticmethod
    def _update_core_event_from_course_event(core_event, course_event) -> bool:
        # Update only the fields that can change over time.
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
            # Persist only the fields that were actually changed.
            core_event.save(
                update_fields=[
                    "description",
                    "location",
                    "colour",
                    "end_time",
                ]
            )

        return updated

    @staticmethod
    def _record_sync_error(
        stats: Dict[str, Any], course_event, username: str, exc: Exception
    ) -> None:
        # Centralized error formatting keeps logs consistent.
        error_msg = (
            f"Failed to sync course_event {course_event.id} "
            f"for user {username}: {str(exc)}"
        )
        logger.error(error_msg, exc_info=True)
        stats["errors"].append(error_msg)

    @staticmethod
    def _log_sync_summary(prefix: str, created: int, updated: int, errors: int) -> None:
        # Emit a compact summary for operational visibility.
        logger.info(
            f"{prefix}. Created: {created}, Updated: {updated}, Errors: {errors}"
        )

    @staticmethod
    def _update_user_specific_core_event(
        core_event, event_description: str, course_event
    ) -> bool:
        # Personalized syncs use a richer description but otherwise follow the same update rules.
        updated = False

        if core_event.description != event_description:
            core_event.description = event_description
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
            core_event.save(
                update_fields=["description", "location", "colour", "end_time"]
            )

        return updated

    @staticmethod
    def _log_enrollment_sync_result(core_event, user, stats: Dict[str, Any], updated: bool) -> None:
        # Keep create/update bookkeeping out of the main sync loop.
        if updated:
            stats["updated"] += 1
            logger.info(f"Updated Event {core_event.id} for user {user.username}")
            return

        stats["created"] += 1
        logger.info(f"Created Event {core_event.id} for user {user.username}")

    @staticmethod
    def _sync_enrollment_core_event(course_event, user, stats: Dict[str, Any], event_title: str) -> None:
        # Sync one student's course event copy.
        try:
            core_event = CourseEventSyncService._get_core_event(
                user=user,
                title=event_title,
                start_time=course_event.start_time,
            )
            updated = CourseEventSyncService._update_core_event_from_course_event(
                core_event, course_event
            )
            CourseEventSyncService._log_enrollment_sync_result(
                core_event, user, stats, updated
            )
        except Event.DoesNotExist:
            core_event = CourseEventSyncService._create_core_event_for_course_student(
                course_event, user
            )
            CourseEventSyncService._log_enrollment_sync_result(
                core_event, user, stats, updated=False
            )

    @staticmethod
    def _get_active_enrollments(course_event):
        # Only active students should receive synced course events.
        from courses.models import CourseEnrollment

        return CourseEnrollment.objects.filter(
            course=course_event.course, active=True
        ).select_related("student__user")

    @staticmethod
    def _sync_active_enrollments(course_event, enrollments, stats: Dict[str, Any]) -> None:
        # Sync one course event across all active students.
        event_title = CourseEventSyncService._course_event_title(course_event)

        for enrollment in enrollments:
            try:
                user = enrollment.student.user
                CourseEventSyncService._sync_enrollment_core_event(
                    course_event, user, stats, event_title
                )
            except Exception as exc:
                CourseEventSyncService._record_sync_error(
                    stats,
                    course_event,
                    enrollment.student.user.username,
                    exc,
                )

    @staticmethod
    def sync_course_event_to_core(course_event) -> Dict[str, Any]:
        """Syncs a single CourseEvent to core.models.Event for all enrolled students.

        Args:
            course_event: CourseEvent instance to sync.

        Returns:
            Dictionary with sync statistics (created, updated, errors).
        """
        stats = CourseEventSyncService._new_stats()

        try:
            enrollments = CourseEventSyncService._get_active_enrollments(course_event)

            if not enrollments.exists():
                logger.info(
                    f"No active enrollments for course {course_event.course.id}"
                )
                return stats

            CourseEventSyncService._sync_active_enrollments(
                course_event, enrollments, stats
            )

            CourseEventSyncService._log_sync_summary(
                f"Course event sync completed for CourseEvent {course_event.id}",
                stats["created"],
                stats["updated"],
                len(stats["errors"]),
            )

        except Exception as exc:
            # Catch unexpected query-level or service-level failures.
            error_msg = f"Failed to sync course event {course_event.id}: {str(exc)}"
            logger.error(error_msg, exc_info=True)
            stats["errors"].append(error_msg)

        return stats

    @staticmethod
    def _get_or_create_user_student(user):
        # Return active enrollments for this user; used to discover related courses.
        from courses.models import CourseEnrollment

        user_enrollments = CourseEnrollment.objects.filter(
            student__user=user, active=True
        ).select_related("course")

        return user_enrollments

    @staticmethod
    def _sync_single_user_course_event(
        user, course_event, stats: Dict[str, Any]
    ) -> None:
        # User-specific title and description are used for personalized calendar entries.
        event_title = CourseEventSyncService._course_event_title(course_event)
        event_description = CourseEventSyncService._course_event_description(
            course_event
        )

        try:
            core_event = CourseEventSyncService._get_core_event(
                user=user,
                title=event_title,
                start_time=course_event.start_time,
            )
        except Event.DoesNotExist:
            try:
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
            except Exception as exc:
                CourseEventSyncService._record_sync_error(
                    stats, course_event, user.username, exc
                )
            return

        try:
            updated = CourseEventSyncService._update_user_specific_core_event(
                core_event, event_description, course_event
            )
            if updated:
                stats["updated"] += 1
        except Exception as exc:
            CourseEventSyncService._record_sync_error(
                stats, course_event, user.username, exc
            )

    @staticmethod
    def sync_user_course_events(user: User) -> Dict[str, Any]:
        """Syncs all CourseEvents for user's enrolled courses to core.models.Event.

        Args:
            user: User instance to sync events for.

        Returns:
            Dictionary with sync statistics.
        """
        from courses.models import CourseEnrollment, CourseEvent

        stats = CourseEventSyncService._new_stats()

        try:
            # Collect the courses the user is actively enrolled in.
            user_enrollments = CourseEnrollment.objects.filter(
                student__user=user, active=True
            ).select_related("course")

            if not user_enrollments.exists():
                logger.info(f"User {user.username} has no active course enrollments")
                return stats

            course_ids = [enrollment.course.id for enrollment in user_enrollments]

            # Fetch all events for those courses in one query.
            course_events = CourseEvent.objects.filter(
                course__in=course_ids
            ).select_related("course")

            for course_event in course_events:
                CourseEventSyncService._sync_single_user_course_event(
                    user, course_event, stats
                )

            CourseEventSyncService._log_sync_summary(
                f"User event sync completed for {user.username}",
                stats["created"],
                stats["updated"],
                len(stats["errors"]),
            )

        except Exception as exc:
            # Top-level guard for unexpected failures.
            error_msg = f"Failed to sync user events for {user.username}: {str(exc)}"
            logger.error(error_msg, exc_info=True)
            stats["errors"].append(error_msg)

        return stats
