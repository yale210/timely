from typing import Any


def _run_user_calendar_sync(
    service: Any,
    user: Any,
    start_date: Any,
    end_date: Any,
    stats: Any,
    support: Any,
    logger: Any,
) -> Any:
    course_ids, synced_events, calendar_map = support.user_calendar_sync_context(
        user,
        service.provider,
        start_date,
        end_date,
    )
    if not course_ids:
        logger.info(f"User {user.username} has no active course enrollments")
        return stats
    for course_event in synced_events:
        service._sync_user_course_event(user, course_event, calendar_map, stats)
    logger.info(
        f"Calendar sync completed for user {user.username}. Created: {stats['created']}, Updated: {stats['updated']}, Deleted: {stats['deleted']}, Errors: {len(stats['errors'])}"
    )
    return stats
