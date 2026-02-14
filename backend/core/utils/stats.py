from datetime import timedelta

from django.db.models import Q, Sum
from django.utils import timezone

from ..models.task import Task


def get_current_week_range(now=None):
    """Return (start, end) datetimes for the current week.

    Week starts on Monday 00:00:00 and ends on Sunday 23:59:59.999999.
    Accepts an optional `now` for deterministic testing.
    """
    if now is None:
        now = timezone.now()

    # Move back to Monday of this week
    start_of_week = (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # Sunday end
    end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
    return start_of_week, end_of_week


def calculate_weekly_stats(user, now=None):
    """Calculate summary stats for the given user's current week.

    Returned dict:
      - total_tasks: int
      - completed_tasks: int
      - completion_percentage: float (0.0-100.0)
      - total_minutes_planned: int

    The function considers a task to belong to the week if its start_time
    or deadline falls within the week's inclusive start/end range.
    """
    start, end = get_current_week_range(now=now)

    qs = Task.objects.filter(Q(user=user))
    # Tasks with start_time or deadline inside the week
    week_q = qs.filter(Q(start_time__range=(start, end)) | Q(deadline__range=(start, end)))

    total_tasks = week_q.count()
    completed_tasks = week_q.filter(completed=True).count()

    minutes_agg = week_q.aggregate(total=Sum("estimated_minutes"))
    total_minutes = minutes_agg.get("total") or 0

    if total_tasks == 0:
        completion_percentage = 0.0
    else:
        completion_percentage = round((completed_tasks / total_tasks) * 100.0, 2)

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_percentage": completion_percentage,
        "total_minutes_planned": int(total_minutes),
    }
