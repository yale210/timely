"""Utility functions for calculating task and productivity statistics.

This module provides helpers to determine the current week's boundaries and
calculate various metrics for a user's tasks, including completion rates,
time-planned summaries, and daily or importance-based breakdowns.
"""

from datetime import timedelta

from django.db.models import Q, Sum
from django.utils import timezone

from ..models.task import Task


def get_current_week_range(now=None):
    """Return (start, end) datetimes for the current week.

    The week starts on Monday 00:00:00 and ends on Sunday 23:59:59.999999.

    Args:
        now (datetime | None): Optional datetime for deterministic testing.
            Defaults to timezone.now().

    Returns:
        tuple[datetime, datetime]: A tuple containing the start and end datetimes.

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

    Aggregates task data for the specified user, including completion counts,
    total time planned, and breakdown lists for daily performance and
    task importance levels.

    Args:
        user (User): The user for whom to calculate statistics.
        now (datetime | None): The reference time point to determine the week.

    Returns:
        dict: A dictionary containing:
            - total_tasks (int): Number of tasks in the week.
            - completed_tasks (int): Number of completed tasks.
            - completion_percentage (float): Percentage of tasks completed.
            - total_minutes_planned (int): Sum of estimated minutes.
            - daily_stats (list): Day-by-day task breakdowns.
            - importance_stats (list): Completed counts per importance level.

    """
    start, end = get_current_week_range(now=now)

    # Tasks with start_time or deadline inside the week
    week_q = _get_weekly_query_set(user, start, end)
    total_tasks = week_q.count()
    completed_tasks = week_q.filter(completed=True).count()
    total_minutes = _get_total_minutes(week_q)
    completion_percentage = _calculate_completion_percentage(
        completed_tasks, total_tasks
    )

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


def _get_weekly_query_set(user, start, end):
    """Filter tasks belonging to a user that fall within a date range.

    Args:
        user (User): The owner of the tasks.
        start (datetime): Start of the range.
        end (datetime): End of the range.

    Returns:
        QuerySet: A filtered Task queryset.

    """
    qs = Task.objects.filter(Q(user=user))
    return qs.filter(
        Q(start_time__range=(start, end)) | Q(deadline__range=(start, end))
    )


def _get_total_minutes(week_q):
    """Sum the estimated minutes for a given task queryset.

    Args:
        week_q (QuerySet): The tasks to sum.

    Returns:
        int: Total estimated minutes.

    """
    minutes_agg = week_q.aggregate(total=Sum("estimated_minutes"))
    return minutes_agg.get("total") or 0


def _calculate_completion_percentage(completed_tasks, total_tasks):
    """Calculate the percentage of completed tasks.

    Args:
        completed_tasks (int): Number of tasks finished.
        total_tasks (int): Total number of tasks.

    Returns:
        float: Completion percentage rounded to two decimal places.

    """
    if total_tasks == 0:
        return 0.0
    return round((completed_tasks / total_tasks) * 100.0, 2)


def _get_daily_breakdown(week_q, start):
    """Return a list of 7 daily summaries starting from Monday.

    Assigns each task to a specific day based on start_time (priority) or
    deadline if start_time is missing.

    Args:
        week_q (QuerySet): The week's tasks.
        start (datetime): Monday start time.

    Returns:
        list[dict]: Daily completion and time stats.

    """
    days = []
    for i in range(7):
        day_start = start + timedelta(days=i)
        day_end = day_start + timedelta(
            hours=23, minutes=59, seconds=59, microseconds=999999
        )
        day_q = _get_daily_query_set(week_q, day_start, day_end)
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


def _get_daily_query_set(week_q, day_start, day_end):
    """Filter tasks that fall on a specific day.

    Args:
        week_q (QuerySet): The base week queryset.
        day_start (datetime): Day beginning.
        day_end (datetime): Day end.

    Returns:
        QuerySet: Tasks occurring on the specified day.

    """
    return week_q.filter(
        Q(start_time__range=(day_start, day_end))
        | Q(start_time__isnull=True, deadline__range=(day_start, day_end))
    )


def _get_importance_breakdown(week_q):
    """Return list of importance levels 1-10 with completed task counts.

    Args:
        week_q (QuerySet): The base week queryset.

    Returns:
        list[dict]: Importance-level stats.

    """
    out = []
    for level in range(1, 11):
        c = week_q.filter(importance=level, completed=True).count()
        out.append({"level": level, "completed_count": c})
    return out
