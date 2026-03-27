from celery import shared_task
from django.contrib.auth import get_user_model

from authentication.models import User
from courses.services.core_event_sync import CourseEventSyncService


@shared_task
def sync_cal(user_id: int | None = None):
    """
    Sync course events to calendars.

    If user_id is provided, sync only that user.
    Otherwise sync all users.
    """
    if user_id is not None:
        user = get_user_model().objects.get(id=user_id)
        return CourseEventSyncService.sync_user_course_events(user)

    all_users = User.objects.all()
    total_created = 0
    total_updated = 0

    for user in all_users:
        stats = CourseEventSyncService.sync_user_course_events(user)
        total_created += stats["created"]
        total_updated += stats["updated"]

    return {
        "created": total_created,
        "updated": total_updated,
    }