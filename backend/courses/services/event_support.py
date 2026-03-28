from datetime import datetime
from typing import Any

from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone

from core.models.event import Event


def course_event_title(course_event) -> str:
    """Build the canonical core-event title for a course event.

    Returns:
        str: Display title used for synced course events.
    """
    return f"{course_event.course.name} - {course_event.title}"


def authored_course_event_description(course_event, separator: str) -> str:
    """Build the learner-facing course-event description.

    Returns:
        str: Description including the course, event, and author details.
    """
    return (
        f"{course_event.course.name} {separator} {course_event.title}"
        + "'\n"
        + (course_event.description or "")
        + "\nBy "
        + course_event.created_by.user.username
    )


def calendar_window(
    start_date: datetime | None, end_date: datetime | None
) -> tuple[datetime, datetime]:
    """Resolve the provider query window for calendar sync.

    Returns:
        tuple[datetime, datetime]: Inclusive sync window bounds.
    """
    return start_date or datetime.min, end_date or timezone.now()


def calendar_event_map(
    calendar_events: list[dict[str, Any]],
) -> dict[Any, dict[str, Any]]:
    """Index provider calendar events by synced course-event id.

    Returns:
        dict[Any, dict[str, Any]]: Provider events keyed by metadata event id.
    """
    return {
        event.get("metadata", {}).get("event_id"): event
        for event in calendar_events
        if event.get("metadata", {}).get("event_id")
    }


def existing_core_event(user: User, course_event):
    """Look up an already-synced core event for a user.

    Returns:
        Event | None: Matching core event when present.
    """
    try:
        return Event._default_manager.get(
            user=user,
            title=course_event_title(course_event),
            start_time=course_event.start_time,
        )
    except ObjectDoesNotExist:
        return None


def active_course_ids(user: User) -> list[int]:
    """Fetch active enrolled course ids for a user.

    Returns:
        list[int]: Active course ids for the user.
    """
    from courses.models.course import CourseEnrollment

    return list(
        CourseEnrollment._default_manager.filter(
            student__user=user, active=True
        ).values_list("course_id", flat=True)
    )


def course_events(
    course_ids: list[int],
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    """Query course events for the supplied courses and optional window.

    Returns:
        Any: QuerySet of matching course events with required relations loaded.
    """
    from courses.models.course import CourseEvent

    query = CourseEvent._default_manager.filter(course__in=course_ids)
    if start_date is not None:
        query = query.filter(start_time__gte=start_date)
    if end_date is not None:
        query = query.filter(end_time__lte=end_date)
    return query.select_related("course", "created_by__user")


def user_calendar_sync_context(
    user: User, provider, start_date: datetime | None, end_date: datetime | None
):
    """Collect the shared inputs for syncing one user's external calendar.

    Returns:
        tuple[list[int], Any, dict[Any, dict[str, Any]]]: Active course ids, matching course events, and provider events keyed by course-event id.
    """
    course_ids = active_course_ids(user)
    if not course_ids:
        return course_ids, [], {}
    synced_events = course_events(course_ids, start_date, end_date)
    calendar_map = calendar_event_map(
        provider.get_events(user, *calendar_window(start_date, end_date))
    )
    return course_ids, synced_events, calendar_map


def create_course_core_event(course_event, user: User) -> None:
    """Create a core event for an enrolled user without author metadata."""
    Event(
        user=user,
        title=course_event_title(course_event),
        description=course_event.description or "",
        location=course_event.location or "",
        colour=course_event.colour,
        start_time=course_event.start_time,
        end_time=course_event.end_time,
    ).save()


def create_user_core_event(course_event, user: User) -> None:
    """Create a core event for a learner-facing calendar sync."""
    Event._default_manager.create(
        user=user,
        title=course_event_title(course_event),
        description=authored_course_event_description(course_event, "-"),
        location=course_event.location or "",
        colour=course_event.colour,
        start_time=course_event.start_time,
        end_time=course_event.end_time,
    )
