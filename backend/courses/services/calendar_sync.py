import datetime
from typing import Optional, Dict, Any

from courses.services.calendar_mapper import CalendarEventMapper
from courses.services.calendar_provider import CalendarProvider
from courses.services.event import logger, User


class SyncCalendar:
    """Service to synchronize course events with user calendar events.

    Handles one-way sync from CourseEvent to user's calendar.
    """

    def __init__(self, provider: CalendarProvider):
        """Initializes the sync service with a calendar provider.

        Args:
            provider: CalendarProvider instance (e.g., GoogleCalendarProvider).
        """
        self.provider = provider
        self.mapper = CalendarEventMapper()

    def sync_user_calendar(
        self,
        user: User,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Syncs all course events for enrolled courses to user's calendar.

        Args:
            user: User instance to sync calendar for.
            start_date: Filter events from this date (optional).
            end_date: Filter events until this date (optional).

        Returns:
            Dictionary with sync statistics (created, updated, deleted, errors).
        """
        from courses.models import CourseEnrollment, CourseEvent

        stats = {
            "created": 0,
            "updated": 0,
            "deleted": 0,
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

            # Build query for course events
            query = CourseEvent.objects.filter(course__in=course_ids)

            if start_date:
                query = query.filter(start_time__gte=start_date)
            if end_date:
                query = query.filter(end_time__lte=end_date)

            course_events = query.select_related("course", "created_by")
            calendar_events = self.provider.get_events(
                user, start_date or datetime.min, end_date or datetime.now()
            )

            # Create a mapping of external IDs to calendar events
            calendar_map = {
                event.get("metadata", {}).get("event_id"): event
                for event in calendar_events
                if event.get("metadata", {}).get("event_id")
            }

            # Sync each course event
            for course_event in course_events:
                try:
                    calendar_data = self.mapper.to_calendar_event(course_event)

                    if course_event.id in calendar_map:
                        # Update existing event
                        if self._event_needs_update(
                            course_event, calendar_map[course_event.id]
                        ):
                            success = self.provider.update_event(
                                user, calendar_map[course_event.id]["id"], calendar_data
                            )
                            if success:
                                stats["updated"] += 1
                            else:
                                stats["errors"].append(
                                    f"Failed to update event {course_event.id}"
                                )
                    else:
                        # Create new event
                        event_id = self.provider.create_event(user, calendar_data)
                        if event_id:
                            stats["created"] += 1
                        else:
                            stats["errors"].append(
                                f"Failed to create event for {course_event.id}"
                            )
                except Exception as e:
                    error_msg = f"Error syncing event {course_event.id}: {str(e)}"
                    logger.error(error_msg)
                    stats["errors"].append(error_msg)

            logger.info(
                f"Calendar sync completed for user {user.username}. "
                f"Created: {stats['created']}, Updated: {stats['updated']}, "
                f"Deleted: {stats['deleted']}, Errors: {len(stats['errors'])}"
            )

        except Exception as e:
            error_msg = f"Failed to sync calendar for user {user.username}: {str(e)}"
            logger.error(error_msg)
            stats["errors"].append(error_msg)

        return stats

    def sync_course_event(
        self, course_event, user: Optional[User] = None
    ) -> Dict[str, Any]:
        """Syncs a single course event to all enrolled users' calendars.

        Args:
            course_event: CourseEvent instance to sync.
            user: Optional specific user to sync for (if None, syncs for all).

        Returns:
            Dictionary with sync statistics.
        """
        from courses.models import CourseEnrollment

        stats = {
            "synced_users": 0,
            "errors": [],
        }

        try:
            # Get all students enrolled in the course
            if user:
                enrollments = CourseEnrollment.objects.filter(
                    course=course_event.course, student__user=user, active=True
                )
            else:
                enrollments = CourseEnrollment.objects.filter(
                    course=course_event.course, active=True
                )

            calendar_data = self.mapper.to_calendar_event(course_event)

            for enrollment in enrollments:
                try:
                    self.provider.create_event(enrollment.student.user, calendar_data)
                    stats["synced_users"] += 1
                except Exception as e:
                    error_msg = (
                        f"Failed to sync event {course_event.id} "
                        f"for user {enrollment.student.user.username}: {str(e)}"
                    )
                    logger.error(error_msg)
                    stats["errors"].append(error_msg)

        except Exception as e:
            error_msg = f"Failed to sync course event {course_event.id}: {str(e)}"
            logger.error(error_msg)
            stats["errors"].append(error_msg)

        return stats

    @staticmethod
    def _event_needs_update(course_event, calendar_event: Dict[str, Any]) -> bool:
        """Determines if a calendar event needs updating based on course event changes.

        Args:
            course_event: CourseEvent instance.
            calendar_event: Calendar event dictionary.

        Returns:
            True if the event should be updated.
        """
        # Compare key fields
        title_match = calendar_event.get("title") == (
            f"{course_event.course.name} - {course_event.title}"
        )
        start_match = calendar_event.get("start") == course_event.start_time.isoformat()
        end_match = calendar_event.get("end") == course_event.end_time.isoformat()
        description_match = calendar_event.get("description") == (
            course_event.description or ""
        )

        return not (title_match and start_match and end_match and description_match)

    def remove_calendar_event(self, user: User, course_event_id: int) -> bool:
        """Removes a course event from user's calendar.

        Args:
            user: User instance.
            course_event_id: ID of the course event to remove.

        Returns:
            True if successful.
        """
        try:
            calendar_events = self.provider.get_events(
                user, datetime.min, datetime.now()
            )

            for event in calendar_events:
                if event.get("metadata", {}).get("event_id") == course_event_id:
                    return self.provider.delete_event(user, event["id"])

            logger.warning(
                f"Calendar event for course_event_id {course_event_id} not found"
            )
            return False
        except Exception as e:
            logger.error(f"Failed to remove calendar event: {str(e)}")
            return False