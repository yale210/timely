from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

from django.utils import timezone

from core.models import Event


def _make_aware(value: datetime) -> datetime:
    if timezone.is_aware(value):
        return value
    return timezone.make_aware(value)


def _field_value(
    validated_data: dict[str, Any],
    name: str,
    *,
    fallback: Any,
) -> Any:
    if name in validated_data:
        return validated_data[name]
    return fallback


def _resolve_occurrence_window(
    event: Event,
    original_start_time: datetime,
) -> tuple[datetime, datetime, datetime]:
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
    if "end_time" in validated_data:
        return _make_aware(validated_data["end_time"])
    if "start_time" in validated_data:
        return submitted_start + (occurrence_end - occurrence_start)
    return occurrence_end


def _align_to_date(source: datetime, target_date: date) -> datetime:
    return datetime.combine(target_date, source.timetz())


def _normalise_shift_and_duration(
    occurrence_start: datetime,
    submitted_start: datetime,
    submitted_end: datetime,
) -> tuple[timedelta, timedelta]:
    aligned_submitted_start = _align_to_date(submitted_start, occurrence_start.date())
    shift = aligned_submitted_start - occurrence_start
    duration = submitted_end - submitted_start
    return shift, duration


def _normalise_all_scope_datetimes(
    event: Event,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> dict[str, Any]:
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
