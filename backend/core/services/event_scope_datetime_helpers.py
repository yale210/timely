"""Datetime manipulation helpers for scoped event updates.

This module provides internal utilities for handling timezone awareness,
calculating occurrence windows (base vs. override), and normalising shifts
and durations when applying changes to event series.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

from django.utils import timezone

from core.models import Event


def _make_aware(value: datetime) -> datetime:
    """Ensure a datetime object is timezone-aware.

    Args:
        value (datetime): The datetime to convert.

    Returns:
        datetime: An aware datetime.

    """
    if timezone.is_aware(value):
        return value
    return timezone.make_aware(value)


def _field_value(
    validated_data: dict[str, Any],
    name: str,
    *,
    fallback: Any,
) -> Any:
    """Safely retrieve a value from a dictionary with a fallback.

    Args:
        validated_data (dict): The data dictionary.
        name (str): The key to retrieve.
        fallback (Any): Value to return if key is missing.

    Returns:
        Any: The found value or the fallback.

    """
    if name in validated_data:
        return validated_data[name]
    return fallback


def _resolve_occurrence_window(
    event: Event,
    original_start_time: datetime,
) -> tuple[datetime, datetime, datetime]:
    """Determine the current start and end times for a specific occurrence.

    Looks up whether an override exists for the given point in time and
    returns the effective window.

    Args:
        event (Event): The parent event.
        original_start_time (datetime): The original start time of the instance.

    Returns:
        tuple: (Anchor time, current occurrence start, current occurrence end).

    """
    anchor_time = _make_aware(original_start_time)
    occurrence_start = anchor_time
    occurrence_end = anchor_time + (event.end_time - event.start_time)
    anchor_override = (
        event.overrides.filter(original_start_time=anchor_time)
        .only(
            "start_time",
            "end_time",
        )
        .first()
    )
    if anchor_override is not None:
        occurrence_start = anchor_override.start_time
        occurrence_end = anchor_override.end_time
    return anchor_time, occurrence_start, occurrence_end


def _resolve_submitted_occurrence_window(
    event: Event,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> tuple[datetime, datetime, datetime, datetime]:
    """Calculate the new window for an occurrence based on submitted update data.

    Args:
        event (Event): The parent event.
        validated_data (dict): The update payload.
        original_start_time (datetime): The original start time of the instance.

    Returns:
        tuple: (Anchor time, current start, new submitted start, new submitted end).

    """
    anchor_time, occurrence_start, occurrence_end = _resolve_occurrence_window(
        event,
        original_start_time,
    )
    submitted_start = _make_aware(
        _field_value(validated_data, "start_time", fallback=occurrence_start)
    )
    submitted_end = _resolve_submitted_end(
        validated_data,
        submitted_start,
        occurrence_start,
        occurrence_end,
    )
    return anchor_time, occurrence_start, submitted_start, submitted_end


def _resolve_submitted_end(
    validated_data: dict[str, Any],
    submitted_start: datetime,
    occurrence_start: datetime,
    occurrence_end: datetime,
) -> datetime:
    """Calculate the new end time for an occurrence.

    Maintains duration if only start_time is provided, otherwise uses the
    explicitly submitted end_time.

    Args:
        validated_data (dict): The update payload.
        submitted_start (datetime): The new start time.
        occurrence_start (datetime): The current start time.
        occurrence_end (datetime): The current end time.

    Returns:
        datetime: The calculated new end time.

    """
    if "end_time" in validated_data:
        return _make_aware(validated_data["end_time"])
    if "start_time" in validated_data:
        return submitted_start + (occurrence_end - occurrence_start)
    return occurrence_end


def _align_to_date(source: datetime, target_date: date) -> datetime:
    """Combine the time from a source datetime with a specific target date.

    Args:
        source (datetime): The datetime to extract time/tz from.
        target_date (date): The date to apply.

    Returns:
        datetime: The combined datetime.

    """
    return datetime.combine(target_date, source.timetz())


def _normalise_shift_and_duration(
    occurrence_start: datetime,
    submitted_start: datetime,
    submitted_end: datetime,
) -> tuple[timedelta, timedelta]:
    """Calculate the time shift and new duration from submitted window changes.

    Args:
        occurrence_start (datetime): Current start time.
        submitted_start (datetime): New start time.
        submitted_end (datetime): New end time.

    Returns:
        tuple: (Time shift as timedelta, duration as timedelta).

    """
    aligned_submitted_start = _align_to_date(submitted_start, occurrence_start.date())
    shift = aligned_submitted_start - occurrence_start
    duration = submitted_end - submitted_start
    return shift, duration


def _normalise_all_scope_datetimes(
    event: Event,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> dict[str, Any]:
    """Normalise start and end times when applying changes to an entire series.

    Ensures that shifts applied to a single instance are correctly translated
    to the base series start_time while preserving duration.

    Args:
        event (Event): The series to normalise.
        validated_data (dict): Submitted changes.
        original_start_time (datetime): Reference occurrence start time.

    Returns:
        dict[str, Any]: Updated data dictionary with normalised datetimes.

    """
    if "start_time" not in validated_data and "end_time" not in validated_data:
        return validated_data
    _, occurrence_start, submitted_start, submitted_end = (
        _resolve_submitted_occurrence_window(event, validated_data, original_start_time)
    )
    shift, duration = _normalise_shift_and_duration(
        occurrence_start,
        submitted_start,
        submitted_end,
    )
    adjusted_start = event.start_time + shift
    normalised = dict(validated_data)
    normalised["start_time"] = adjusted_start
    normalised["end_time"] = adjusted_start + duration
    return normalised


def _normalise_following_child_window(
    event: Event,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> tuple[datetime, datetime]:
    """Calculate the new window for a child event in a 'following' scope split.

    Args:
        event (Event): Parent series.
        validated_data (dict): Submitted changes.
        original_start_time (datetime): Split point.

    Returns:
        tuple: (New child start_time, new child end_time).

    """
    anchor_time, occurrence_start, submitted_start, submitted_end = (
        _resolve_submitted_occurrence_window(event, validated_data, original_start_time)
    )
    shift, duration = _normalise_shift_and_duration(
        occurrence_start,
        submitted_start,
        submitted_end,
    )
    child_start = anchor_time + shift
    child_end = child_start + duration
    return child_start, child_end
