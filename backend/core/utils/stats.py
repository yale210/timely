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
    end_of_week = start_of_week + timedelta(
        days=6, hours=23, minutes=59, seconds=59, microseconds=999999
    )
    return start_of_week, end_of_week


def calculate_weekly_stats(user, now=None):
    """Calculate summary stats for the week containing the given 'now' datetime.

    If 'now' is None, the current week's statistics are calculated.

    Returned dict:
      - total_tasks: int
      - completed_tasks: int
      - completion_percentage: float (0.0-100.0)
      - total_minutes_planned: int
      - daily_stats: list of dicts with day breakdowns (completed count and total minutes)
    - importance_stats: list of dicts with completed task counts per importance level (1-10)

    A task is included in the week's overall statistics if its start_time
    or deadline falls within the week's inclusive start/end range.
    """
    start, end = get_current_week_range(now=now)

    qs = Task.objects.filter(Q(user=user))
    # Tasks with start_time or deadline inside the week
    week_q = qs.filter(
        Q(start_time__range=(start, end)) | Q(deadline__range=(start, end))
    )

    total_tasks = week_q.count()
    completed_tasks = week_q.filter(completed=True).count()

    minutes_agg = week_q.aggregate(total=Sum("estimated_minutes"))
    total_minutes = minutes_agg.get("total") or 0

    if total_tasks == 0:
        completion_percentage = 0.0
    else:
        completion_percentage = round((completed_tasks / total_tasks) * 100.0, 2)

    # Daily and importance breakdowns
    daily_stats = _get_daily_breakdown(week_q, start)
    importance_stats = _get_importance_breakdown(week_q)

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_percentage": completion_percentage,
        "total_minutes_planned": int(total_minutes),
        "daily_stats": daily_stats,
        "importance_stats": importance_stats,
    }


def _get_daily_breakdown(week_q, start):
    """Return list for 7 days starting at `start` (Monday).

    A task is assigned to at most one day:
      - If start_time is set, the task is counted on the day of start_time.
      - If start_time is NULL, the task is counted on the day of deadline.

    """
    days = []
    for i in range(7):
        day_start = start + timedelta(days=i)
        day_end = day_start + timedelta(
            hours=23, minutes=59, seconds=59, microseconds=999999
        )
        day_q = week_q.filter(
            Q(start_time__range=(day_start, day_end))
            | Q(start_time__isnull=True, deadline__range=(day_start, day_end))
        )
        completed = day_q.filter(completed=True).count()
        minutes = day_q.aggregate(total=Sum("estimated_minutes")).get("total") or 0
        days.append(
            {
                "day": day_start.strftime("%a"),
                "completed_count": completed,
                "total_minutes": int(minutes),
            }
        )
    return days


def _get_importance_breakdown(week_q):
    """Return list of importance levels 1..10 with completed counts."""
    out = []
    for level in range(1, 11):
        c = week_q.filter(importance=level, completed=True).count()
        out.append({"level": level, "completed_count": c})
    return out
