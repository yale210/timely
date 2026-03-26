from __future__ import annotations

from datetime import datetime, timedelta

TimeRange = tuple[datetime, datetime]


def minutes_between(start: datetime, end: datetime) -> int:
    """
    Calculate the number of minutes between two datetimes.

    Args:
        start (datetime): The starting datetime.
        end (datetime): The ending datetime.

    Returns:
        int: The number of minutes between start and end.
    """
    return int((end - start).total_seconds() // 60)


def overlap_minutes(
    start: datetime,
    end: datetime,
    window_start: datetime,
    window_end: datetime,
) -> int:
    """
    Calculate the number of overlapping minutes between two time intervals.

    Args:
        start (datetime): Start of the first interval.
        end (datetime): End of the first interval.
        window_start (datetime): Start of the second interval (window).
        window_end (datetime): End of the second interval (window).

    Returns:
        int: The number of minutes of overlap between the two intervals.
    """
    overlap_start = max(start, window_start)
    overlap_end = min(end, window_end)
    if overlap_end <= overlap_start:
        return 0
    return minutes_between(overlap_start, overlap_end)


def merge_intervals(intervals: list[TimeRange]) -> list[TimeRange]:
    """
    Merge overlapping or adjacent time intervals.

    Args:
        intervals (list[TimeRange]): A list of time intervals.

    Returns:
        list[TimeRange]: A list of merged time intervals, sorted by start time.
    """
    merged: list[TimeRange] = []
    for start, end in sorted(intervals, key=lambda interval: interval[0]):
        if not merged or start > merged[-1][1]:
            merged.append((start, end))
            continue
        previous_start, previous_end = merged[-1]
        merged[-1] = (previous_start, max(previous_end, end))
    return merged


def subtract_intervals(window: TimeRange, occupied: list[TimeRange]) -> list[TimeRange]:
    """
    Subtract occupied intervals from a window to find free time intervals.

    Args:
        window (TimeRange): The total time window.
        occupied (list[TimeRange]): A list of occupied time intervals.

    Returns:
        list[TimeRange]: A list of free time intervals within the window.
    """
    start, end = window
    free: list[TimeRange] = []
    cursor = start
    for occupied_start, occupied_end in merge_intervals(occupied):
        if occupied_end <= cursor or occupied_start >= end:
            continue
        if occupied_start > cursor:
            free.append((cursor, min(occupied_start, end)))
        cursor = max(cursor, occupied_end)
        if cursor >= end:
            return free
    if cursor < end:
        free.append((cursor, end))
    return free


def clamp_slots(
    slots: list[TimeRange],
    *,
    not_before: datetime | None = None,
    not_after: datetime | None = None,
) -> list[TimeRange]:
    """
    Clamp a list of time slots within specified boundaries.

    Args:
        slots (list[TimeRange]): A list of time slots.
        not_before (datetime | None): Optional boundary; slots starting before this will be truncated.
        not_after (datetime | None): Optional boundary; slots ending after this will be truncated.

    Returns:
        list[TimeRange]: A list of clamped time slots.
    """
    clamped: list[TimeRange] = []
    for start, end in slots:
        next_start = max(start, not_before) if not_before else start
        next_end = min(end, not_after) if not_after else end
        if next_end > next_start:
            clamped.append((next_start, next_end))
    return clamped


def trim_slots_to_minutes(slots: list[TimeRange], minutes: int) -> list[TimeRange]:
    """
    Trim a list of time slots so their total duration does not exceed a limit.

    Args:
        slots (list[TimeRange]): A list of time slots.
        minutes (int): The maximum total duration in minutes.

    Returns:
        list[TimeRange]: A list of trimmed time slots.
    """
    trimmed: list[TimeRange] = []
    minutes_left = minutes
    for start, end in slots:
        if minutes_left <= 0:
            return trimmed
        slot_minutes = minutes_between(start, end)
        if slot_minutes <= minutes_left:
            trimmed.append((start, end))
            minutes_left -= slot_minutes
            continue
        trimmed.append((start, start + timedelta(minutes=minutes_left)))
        return trimmed
    return trimmed


def filter_slots_by_minutes(
    slots: list[TimeRange], min_minutes: int
) -> list[TimeRange]:
    """
    Filter time slots that are shorter than a minimum duration.

    Args:
        slots (list[TimeRange]): A list of time slots.
        min_minutes (int): The minimum required duration in minutes.

    Returns:
        list[TimeRange]: A list of time slots that meet the minimum duration.
    """
    return [
        (start, end)
        for start, end in slots
        if minutes_between(start, end) >= min_minutes
    ]
