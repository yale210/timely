from typing import Any, Dict

from core.models import Event
from courses.services.event import logger


def new_sync_stats() -> Dict[str, Any]:
    """Track sync outcome across the whole operation."""
    return {
        "created": 0,
        "updated": 0,
        "errors": [],
    }


def course_event_title(course_event) -> str:
    """Build a consistent title used to match core events."""
    return f"{course_event.course.name} - {course_event.title}"


def course_event_description(course_event) -> str:
    """Build the richer user-facing description for synced course events."""
    return (
        f"{course_event.course.name} - {course_event.title}"
        + "'\n"
        + (course_event.description or "")
        + "\n"
        + "By "
        + course_event.created_by.user.username
    )


def get_core_event(user, title: str, start_time):
    """Look up the target calendar event using the stable identity fields."""
    try:
        return Event.objects.get(
            user=user,
            title=title,
            start_time=start_time,
        )
    except Event.DoesNotExist:
        # Fall back to a title-only match when there is exactly one existing synced
        # copy. This lets sync update a moved course event instead of duplicating it.
        title_matches = Event.objects.filter(
            user=user,
            title=title,
        )
        if title_matches.count() == 1:
            return title_matches.get()
        raise


def create_core_event_for_course_student(course_event, user):
    """Create a new core event copy for a specific enrolled student."""
    core_event = Event(
        user=user,
        title=course_event_title(course_event),
        description=course_event.description or "",
        location=course_event.location or "",
        colour=course_event.colour,
        start_time=course_event.start_time,
        end_time=course_event.end_time,
    )
    core_event.save()
    return core_event


def update_core_event_from_course_event(core_event, course_event) -> bool:
    """Update shared synced event fields from the source course event."""
    updated = False

    if core_event.start_time != course_event.start_time:
        core_event.start_time = course_event.start_time
        updated = True
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
        core_event.save(
            update_fields=[
                "start_time",
                "description",
                "location",
                "colour",
                "end_time",
            ]
        )

    return updated


def update_user_specific_core_event(
    core_event, event_description: str, course_event
) -> bool:
    """Update a user's personalized synced event fields."""
    updated = False

    if core_event.start_time != course_event.start_time:
        core_event.start_time = course_event.start_time
        updated = True
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
            update_fields=[
                "start_time",
                "description",
                "location",
                "colour",
                "end_time",
            ]
        )

    return updated


def record_sync_error(
    stats: Dict[str, Any], course_event, username: str, exc: Exception
) -> None:
    """Append and log a sync error."""
    error_msg = (
        f"Failed to sync course_event {course_event.id} for user {username}: {str(exc)}"
    )
    logger.error(error_msg, exc_info=True)
    stats["errors"].append(error_msg)


def log_sync_summary(prefix: str, created: int, updated: int, errors: int) -> None:
    """Emit a compact operational summary for a sync run."""
    logger.info(f"{prefix}. Created: {created}, Updated: {updated}, Errors: {errors}")


def log_enrollment_sync_result(
    core_event, user, stats: Dict[str, Any], updated: bool
) -> None:
    """Record whether an enrollment sync created or updated an event."""
    if updated:
        stats["updated"] += 1
        logger.info(f"Updated Event {core_event.id} for user {user.username}")
        return

    stats["created"] += 1
    logger.info(f"Created Event {core_event.id} for user {user.username}")
