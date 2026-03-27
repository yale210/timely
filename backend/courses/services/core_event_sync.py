from typing import Dict, Any

from core.models import Event
from courses.models import Teacher, Course
from courses.services.event import logger, User


class CourseEventSyncService:
    """Service to sync CourseEvent objects to core.models.Event.

    Handles synchronization for enrolled students and the event creator.
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
        creator_username = (
            course_event.created_by.user.username
            if getattr(course_event, "created_by", None)
            and getattr(course_event.created_by, "user", None)
            else "Unknown"
        )
        return (
            f"{course_event.course.name} - {course_event.title}"
            + "'\n"
            + (course_event.description or "")
            + "\n"
            + "By "
            + creator_username
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
    def _create_core_event_for_user(course_event, user):
        # Create a new core event copy for a specific user.
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
    def _create_core_event_for_creator(course_event, user):
        # Create a creator-specific copy with the creator-aware description.
        core_event = Event(
            user=user,
            title=CourseEventSyncService._course_event_title(course_event),
            description=CourseEventSyncService._course_event_description(course_event),
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
        expected_description = course_event.description or ""

        if core_event.description != expected_description:
            core_event.description = expected_description
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
        logger.info(f"{prefix}. Created: {created}, Updated: {updated}, Errors: {errors}")

    @staticmethod
    def sync_course_event_to_core(course_event) -> Dict[str, Any]:
        """Syncs a single CourseEvent to core.models.Event for all enrolled students
        and the event creator.

        Args:
            course_event: CourseEvent instance to sync.

        Returns:
            Dictionary with sync statistics (created, updated, errors).
        """
        from courses.models import CourseEnrollment

        stats = CourseEventSyncService._new_stats()

        try:
            # Only active enrollments should receive synced events.
            enrollments = CourseEnrollment.objects.filter(
                course=course_event.course, active=True
            ).select_related("student__user")

            event_title = CourseEventSyncService._course_event_title(course_event)

            # Sync enrolled students.
            for enrollment in enrollments:
                try:
                    user = enrollment.student.user

                    try:
                        core_event = CourseEventSyncService._get_core_event(
                            user=user,
                            title=event_title,
                            start_time=course_event.start_time,
                        )
                        updated = CourseEventSyncService._update_core_event_from_course_event(
                            core_event, course_event
                        )
                        if updated:
                            stats["updated"] += 1
                            logger.info(
                                f"Updated Event {core_event.id} for user {user.username}"
                            )

                    except Event.DoesNotExist:
                        core_event = CourseEventSyncService._create_core_event_for_user(
                            course_event, user
                        )
                        stats["created"] += 1
                        logger.info(
                            f"Created Event {core_event.id} for user {user.username}"
                        )

                except Exception as exc:
                    CourseEventSyncService._record_sync_error(
                        stats, course_event, enrollment.student.user.username, exc
                    )

            # Sync the creator too, if present.
            creator_user = (
                course_event.created_by.user
                if getattr(course_event, "created_by", None)
                and getattr(course_event.created_by, "user", None)
                else None
            )

            if creator_user:
                try:
                    try:
                        core_event = CourseEventSyncService._get_core_event(
                            user=creator_user,
                            title=event_title,
                            start_time=course_event.start_time,
                        )

                        creator_description = CourseEventSyncService._course_event_description(
                            course_event
                        )
                        updated = False
                        if core_event.description != creator_description:
                            core_event.description = creator_description
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
                                update_fields=[
                                    "description",
                                    "location",
                                    "colour",
                                    "end_time",
                                ]
                            )
                            stats["updated"] += 1
                            logger.info(
                                f"Updated creator Event {core_event.id} for user {creator_user.username}"
                            )

                    except Event.DoesNotExist:
                        core_event = CourseEventSyncService._create_core_event_for_creator(
                            course_event, creator_user
                        )
                        stats["created"] += 1
                        logger.info(
                            f"Created creator Event {core_event.id} for user {creator_user.username}"
                        )

                except Exception as exc:
                    CourseEventSyncService._record_sync_error(
                        stats, course_event, creator_user.username, exc
                    )

            CourseEventSyncService._log_sync_summary(
                f"Course event sync completed for CourseEvent {course_event.id}",
                stats["created"],
                stats["updated"],
                len(stats["errors"]),
            )

        except Exception as exc:
            error_msg = f"Failed to sync course event {course_event.id}: {str(exc)}"
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

        stats = CourseEventSyncService._new_stats()

        try:
            user_enrollments = CourseEnrollment.objects.filter(
                student__user=user, active=True
            ).select_related("course")

            if not user_enrollments.exists():
                logger.info(f"User {user.username} has no active course enrollments")
                return stats

            course_ids = [enrollment.course.id for enrollment in user_enrollments]
            course_events = CourseEvent.objects.filter(course__in=course_ids).select_related(
                "course", "created_by"
            )
            for course_event in course_events:
                CourseEventSyncService._sync_single_user_course_event(user, course_event, stats)

            CourseEventSyncService._log_sync_summary(
                f"User event sync completed for {user.username}",
                stats["created"],
                stats["updated"],
                len(stats["errors"]),
            )

        except Exception as exc:
            error_msg = f"Failed to sync user events for {user.username}: {str(exc)}"
            logger.error(error_msg, exc_info=True)
            stats["errors"].append(error_msg)

        return stats

    @staticmethod
    def _sync_single_user_course_event(user, course_event, stats: Dict[str, Any]) -> None:
        # User-specific title and description are used for personalized calendar entries.
        event_title = CourseEventSyncService._course_event_title(course_event)
        event_description = CourseEventSyncService._course_event_description(course_event)

        try:
            try:
                core_event = CourseEventSyncService._get_core_event(
                    user=user,
                    title=event_title,
                    start_time=course_event.start_time,
                )

                updated = False
                if core_event.description != event_description:
                    core_event.description = event_description
                    updated = True
                if core_event.end_time != course_event.end_time:
                    core_event.end_time = course_event.end_time
                    updated = True

                if updated:
                    core_event.save(update_fields=["description", "end_time"])
                    stats["updated"] += 1

            except Event.DoesNotExist:
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
            error_msg = (
                f"Failed to sync course_event {course_event.id} "
                f"for user {user.username}: {str(exc)}"
            )
            logger.error(error_msg, exc_info=True)
            stats["errors"].append(error_msg)