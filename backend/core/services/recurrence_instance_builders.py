from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Iterable

from core.models import Event, EventOverride


@dataclass(frozen=True)
class ExpandedEventInstance:
    """Materialised calendar instance returned by recurrence expansion."""
    id: int
    title: str
    description: str
    location: str
    colour: str | None
    categories: list[Any]
    start_time: datetime
    end_time: datetime
    recurrence_interval: str | None
    recurrence_end: date | None
    reminders: list[dict[str, Any]]
    is_override: bool
    source_event_id: int
    original_start_time: datetime | None
    instance_id: str
    is_split_series: bool
    split_from_event_id: int | None


def normalise_reminder_snapshot(
    reminders_snapshot: Iterable[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Coerce reminder snapshot values into the event reminder payload shape."""
    normalised: list[dict[str, Any]] = []
    for reminder in reminders_snapshot:
        try:
            minutes_before = int(reminder.get("minutes_before", 0))
        except (TypeError, ValueError):
            continue
        normalised.append(
            {
                "send_email": bool(reminder.get("send_email", False)),
                "send_push": bool(reminder.get("send_push", False)),
                "minutes_before": minutes_before,
            }
        )
    return normalised


def _build_instance_id(
    source_event_id: int,
    is_override: bool,
    anchor_time: datetime | None,
    start_time: datetime,
) -> str:
    anchor = (anchor_time or start_time).isoformat()
    kind = "override" if is_override else "base"
    return f"{source_event_id}:{anchor}:{kind}"


def _build_instance_metadata(
    source_event: Event,
    is_override: bool,
    original_start_time: datetime | None,
    start_time: datetime,
) -> dict[str, Any]:
    return {
        "id": source_event.id,
        "recurrence_interval": source_event.recurrence_interval,
        "recurrence_end": source_event.recurrence_end,
        "is_override": is_override,
        "source_event_id": source_event.id,
        "original_start_time": original_start_time,
        "instance_id": _build_instance_id(
            source_event.id,
            is_override,
            original_start_time,
            start_time,
        ),
        "is_split_series": source_event.split_from_event_id is not None,
        "split_from_event_id": source_event.split_from_event_id,
    }


def _build_expanded_instance(
    *,
    source_event: Event,
    categories: list[Any],
    reminders: list[dict[str, Any]],
    start_time: datetime,
    end_time: datetime,
    is_override: bool,
    original_start_time: datetime | None,
    title: str,
    description: str,
    location: str,
    colour: str | None,
) -> ExpandedEventInstance:
    metadata = _build_instance_metadata(
        source_event, is_override, original_start_time, start_time
    )
    return ExpandedEventInstance(
        title=title,
        description=description,
        location=location,
        colour=colour,
        categories=categories,
        start_time=start_time,
        end_time=end_time,
        reminders=reminders,
        **metadata,
    )


def build_override_instance(
    source_event: Event,
    override: EventOverride,
    *,
    reminder_cache: list[dict[str, Any]],
) -> ExpandedEventInstance:
    """Build an expanded instance from an override row."""
    return _build_expanded_instance(
        source_event=source_event,
        categories=list(override.categories.all()),
        reminders=normalise_reminder_snapshot(
            override.reminders_snapshot or reminder_cache
        ),
        start_time=override.start_time,
        end_time=override.end_time,
        is_override=True,
        original_start_time=override.original_start_time,
        title=override.title,
        description=override.description,
        location=override.location,
        colour=override.colour or source_event.colour,
    )


def build_base_instance(
    source_event: Event,
    *,
    categories: list[Any],
    reminders: list[dict[str, Any]],
    occurrence_start: datetime,
    occurrence_end: datetime,
) -> ExpandedEventInstance:
    """Build an expanded instance for a base recurring occurrence."""
    original_start_time = occurrence_start if source_event.recurrence_interval else None
    return _build_expanded_instance(
        source_event=source_event,
        categories=categories,
        reminders=reminders,
        start_time=occurrence_start,
        end_time=occurrence_end,
        is_override=False,
        original_start_time=original_start_time,
        title=source_event.title,
        description=source_event.description,
        location=source_event.location,
        colour=source_event.colour,
    )
