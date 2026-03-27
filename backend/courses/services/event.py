import logging
from abc import ABC, abstractmethod
from datetime import datetime
from importlib import import_module
from typing import Any, TypedDict

from django.contrib.auth.models import User

from core.models.event import Event
from courses.services.event_sync_helpers import _run_user_calendar_sync

support = import_module("courses.services.event_support")
logger = logging.getLogger(__name__)


class CalendarSyncStats(TypedDict):
    """Result counters for a user calendar sync run."""

    created: int
    updated: int
    deleted: int
    errors: list[str]


class CalendarCourseSyncStats(TypedDict):
    """Result counters for syncing one course event to users."""

    synced_users: int
    errors: list[str]


class CoreSyncStats(TypedDict):
    """Result counters for syncing course events into core events."""

    created: int
    updated: int
    errors: list[str]


class CalendarProvider(ABC):
    """Calendar provider contract used by sync services."""

    @abstractmethod
    def create_event(self, user: User, event_data: dict[str, Any]) -> str:
        """Create an event in the external calendar.

        Returns:
            str: External provider event identifier.
        """

    @abstractmethod
    def update_event(
        self, user: User, event_id: str, event_data: dict[str, Any]
    ) -> bool:
        """Update an existing external calendar event.

        Returns:
            bool: True when the provider reports success.
        """

    @abstractmethod
    def delete_event(self, user: User, event_id: str) -> bool:
        """Delete an external calendar event.

        Returns:
            bool: True when the provider reports success.
        """

    @abstractmethod
    def get_events(
        self, user: User, start_date: datetime, end_date: datetime
    ) -> list[dict[str, Any]]:
        """Fetch external calendar events for a user within a window.

        Returns:
            list[dict[str, Any]]: Provider event payloads.
        """


class CalendarEventMapper:
    """Translate course events into provider event payloads."""

    @staticmethod
    def to_calendar_event(course_event) -> dict[str, Any]:
        """Convert a course event into provider event data.

        Returns:
            dict[str, Any]: Provider-ready event payload.
        """
        return {
            "title": f"{course_event.title}",
            "description": support.authored_course_event_description(course_event, "+"),
            "location": getattr(course_event, "location", ""),
        }


class SyncCalendar:
    """Synchronise course events with an external calendar provider."""

    def __init__(self, provider: CalendarProvider):
        """Store the provider implementation used for sync operations."""
        self.provider = provider
        self.mapper = CalendarEventMapper()

    def sync_user_calendar(
        self,
        user: User,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> CalendarSyncStats:
        """Sync all active course events into one user's external calendar.

        Returns:
            CalendarSyncStats: Aggregate sync counters and collected errors.
        """
        stats: CalendarSyncStats = {
            "created": 0,
            "updated": 0,
            "deleted": 0,
            "errors": [],
        }
        try:
            return _run_user_calendar_sync(
                self,
                user,
                start_date,
                end_date,
                stats,
                support,
                logger,
            )
        except Exception as exc:
            error_msg = f"Failed to sync calendar for user {user.username}: {exc!s}"
            logger.error(error_msg)
            stats["errors"].append(error_msg)
        return stats

    def sync_course_event(
        self, course_event, user: User | None = None
    ) -> CalendarCourseSyncStats:
        """Sync one course event to enrolled users' external calendars.

        Returns:
            CalendarCourseSyncStats: User sync totals and collected errors.
        """
        from courses.models.course import CourseEnrollment

        stats: CalendarCourseSyncStats = {"synced_users": 0, "errors": []}
        try:
            filters = {"course": course_event.course, "active": True}
            if user is not None:
                filters["student__user"] = user
            calendar_data = self.mapper.to_calendar_event(course_event)
            enrollments = CourseEnrollment._default_manager.filter(
                **filters
            ).select_related("student__user")
            for enrollment in enrollments:
                self._sync_enrolment_calendar_event(
                    enrollment.student.user, calendar_data, course_event.id, stats
                )
        except Exception as exc:
            error_msg = f"Failed to sync course event {course_event.id}: {exc!s}"
            logger.error(error_msg)
            stats["errors"].append(error_msg)
        return stats

    @staticmethod
    def _event_needs_update(course_event, calendar_event: dict[str, Any]) -> bool:
        return not (
            calendar_event.get("title") == support.course_event_title(course_event)
            and calendar_event.get("start") == course_event.start_time.isoformat()
            and calendar_event.get("end") == course_event.end_time.isoformat()
            and calendar_event.get("description") == (course_event.description or "")
        )

    def remove_calendar_event(self, user: User, course_event_id: int) -> bool:
        """Remove a synced calendar event for the given course event.

        Returns:
            bool: True when a matching provider event was deleted.
        """
        try:
            matched_event = next(
                (
                    event
                    for event in self.provider.get_events(
                        user, *support.calendar_window(None, None)
                    )
                    if event.get("metadata", {}).get("event_id") == course_event_id
                ),
                None,
            )
            if matched_event is None:
                logger.warning(
                    f"Calendar event for course_event_id {course_event_id} not found"
                )
                return False
            return self.provider.delete_event(user, matched_event["id"])
        except Exception as exc:
            logger.error(f"Failed to remove calendar event: {exc!s}")
            return False

    def _sync_user_course_event(
        self,
        user: User,
        course_event,
        calendar_map: dict[Any, dict[str, Any]],
        stats: CalendarSyncStats,
    ) -> None:
        try:
            calendar_data = self.mapper.to_calendar_event(course_event)
            existing_event = calendar_map.get(course_event.id)
            if existing_event is None:
                self._create_calendar_event(user, course_event.id, calendar_data, stats)
                return
            self._update_calendar_event(
                user, course_event, existing_event, calendar_data, stats
            )
        except Exception as exc:
            error_msg = f"Error syncing event {course_event.id}: {exc!s}"
            logger.error(error_msg)
            stats["errors"].append(error_msg)

    def _create_calendar_event(
        self,
        user: User,
        course_event_id: int,
        calendar_data: dict[str, Any],
        stats: CalendarSyncStats,
    ) -> None:
        if self.provider.create_event(user, calendar_data):
            stats["created"] += 1
            return
        stats["errors"].append(f"Failed to create event for {course_event_id}")

    def _update_calendar_event(
        self,
        user: User,
        course_event,
        existing_event: dict[str, Any],
        calendar_data: dict[str, Any],
        stats: CalendarSyncStats,
    ) -> None:
        if not self._event_needs_update(course_event, existing_event):
            return
        if self.provider.update_event(user, existing_event["id"], calendar_data):
            stats["updated"] += 1
            return
        stats["errors"].append(f"Failed to update event {course_event.id}")

    def _sync_enrolment_calendar_event(
        self,
        user: User,
        calendar_data: dict[str, Any],
        course_event_id: int,
        stats: CalendarCourseSyncStats,
    ) -> None:
        try:
            self.provider.create_event(user, calendar_data)
            stats["synced_users"] += 1
        except Exception as exc:
            error_msg = f"Failed to sync event {course_event_id} for user {user.username}: {exc!s}"
            logger.error(error_msg)
            stats["errors"].append(error_msg)


class CourseEventSyncService:
    """Synchronise course events into core calendar events."""

    @staticmethod
    def sync_course_event_to_core(course_event) -> CoreSyncStats:
        """Sync one course event to core events for active enrolled users.

        Returns:
            CoreSyncStats: Aggregate create and update counts.
        """
        from courses.models.course import CourseEnrollment

        stats: CoreSyncStats = {"created": 0, "updated": 0, "errors": []}
        try:
            enrollments = CourseEnrollment._default_manager.filter(
                course=course_event.course, active=True
            ).select_related("student__user")
            if not enrollments.exists():
                logger.info(
                    f"No active enrollments for course {course_event.course.id}"
                )
                return stats
            for enrollment in enrollments:
                CourseEventSyncService._sync_core_event(
                    course_event,
                    enrollment.student.user,
                    stats,
                    support.create_course_core_event,
                    CourseEventSyncService._update_course_core_event,
                )
            logger.info(
                f"Course event sync completed for CourseEvent {course_event.id}. Created: {stats['created']}, Updated: {stats['updated']}, Errors: {len(stats['errors'])}"
            )
        except Exception as exc:
            error_msg = f"Failed to sync course event {course_event.id}: {exc!s}"
            logger.error(error_msg, exc_info=True)
            stats["errors"].append(error_msg)
        return stats

    @staticmethod
    def sync_user_course_events(user: User) -> CoreSyncStats:
        """Sync all enrolled course events into one user's core calendar.

        Returns:
            CoreSyncStats: Aggregate create and update counts.
        """
        stats: CoreSyncStats = {"created": 0, "updated": 0, "errors": []}
        try:
            course_ids = support.active_course_ids(user)
            if not course_ids:
                logger.info(f"User {user.username} has no active course enrollments")
                return stats
            for course_event in support.course_events(course_ids):
                CourseEventSyncService._sync_core_event(
                    course_event,
                    user,
                    stats,
                    support.create_user_core_event,
                    CourseEventSyncService._update_user_core_event,
                )
            logger.info(
                f"User event sync completed for {user.username}. Created: {stats['created']}, Updated: {stats['updated']}, Errors: {len(stats['errors'])}"
            )
        except Exception as exc:
            error_msg = f"Failed to sync user events for {user.username}: {exc!s}"
            logger.error(error_msg, exc_info=True)
            stats["errors"].append(error_msg)
        return stats

    @staticmethod
    def _sync_core_event(
        course_event,
        user: User,
        stats: CoreSyncStats,
        create_core_event,
        update_core_event,
    ) -> None:
        try:
            core_event = support.existing_core_event(user, course_event)
            if core_event is None:
                create_core_event(course_event, user)
                stats["created"] += 1
                return
            if update_core_event(core_event, course_event):
                stats["updated"] += 1
        except Exception as exc:
            error_msg = f"Failed to sync course_event {course_event.id} for user {user.username}: {exc!s}"
            logger.error(error_msg, exc_info=True)
            stats["errors"].append(error_msg)

    @staticmethod
    def _update_course_core_event(core_event: Event, course_event) -> bool:
        update_fields = []
        for field, value in (
            ("description", course_event.description or ""),
            ("location", course_event.location or ""),
            ("colour", course_event.colour),
            ("end_time", course_event.end_time),
        ):
            if getattr(core_event, field) != value:
                setattr(core_event, field, value)
                update_fields.append(field)
        if not update_fields:
            return False
        core_event.save(update_fields=update_fields)
        logger.info("Updated Event for enrolled user")
        return True

    @staticmethod
    def _update_user_core_event(core_event: Event, course_event) -> bool:
        update_fields = []
        if core_event.description != (course_event.description or ""):
            setattr(
                core_event,
                "description",
                support.authored_course_event_description(course_event, "-"),
            )
            update_fields.append("description")
        if core_event.end_time != course_event.end_time:
            setattr(core_event, "end_time", course_event.end_time)
            update_fields.append("end_time")
        if not update_fields:
            return False
        core_event.save(update_fields=update_fields)
        return True
