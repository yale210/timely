from __future__ import annotations

from datetime import datetime
from typing import Any

from core.services.recurrence_instance_builders import (
    ExpandedEventInstance,
    build_base_instance,
    build_override_instance,
)
from core.services.recurrence_rule_helpers import (
    _generate_occurrence_starts,
    _make_aware,
    serialise_event_reminders,
)


def _build_expanded_content(
    event: Any,
    range_start: datetime,
    range_end: datetime,
    overrides: list[Any] | None,
) -> tuple[Any, ...]:
    range_start = _make_aware(range_start)
    range_end = _make_aware(range_end)
    category_cache = list(event.categories.all())
    reminder_cache = serialise_event_reminders(event)
    duration = event.end_time - event.start_time
    exception_dates = set(event.exception_dates or [])
    loaded_overrides = (
        overrides
        if overrides is not None
        else list(event.overrides.prefetch_related("categories").all())
    )
    overrides_by_original = {
        override.original_start_time: override for override in loaded_overrides
    }
    return (
        range_start,
        range_end,
        category_cache,
        reminder_cache,
        duration,
        exception_dates,
        loaded_overrides,
        overrides_by_original,
    )


def _should_include_base_occurrence(
    event: Any,
    occurrence_start: datetime,
    occurrence_end: datetime,
    range_start: datetime,
    range_end: datetime,
) -> bool:
    return range_start <= occurrence_start <= range_end or (
        not event.recurrence_interval
        and occurrence_start <= range_end
        and occurrence_end >= range_start
    )


def _build_override_occurrence(
    override: Any,
    event: Any,
    range_start: datetime,
    range_end: datetime,
    reminder_cache: list[dict[str, Any]],
) -> tuple[ExpandedEventInstance | None, int | None]:
    if not range_start <= override.start_time <= range_end:
        return None, override.id
    return build_override_instance(
        event,
        override,
        reminder_cache=reminder_cache,
    ), override.id


def _build_base_occurrence(
    event: Any,
    occurrence_start: datetime,
    occurrence_end: datetime,
    range_start: datetime,
    range_end: datetime,
    category_cache: list[Any],
    reminder_cache: list[dict[str, Any]],
) -> tuple[ExpandedEventInstance | None, None]:
    if not _should_include_base_occurrence(
        event,
        occurrence_start,
        occurrence_end,
        range_start,
        range_end,
    ):
        return None, None
    return build_base_instance(
        event,
        categories=category_cache,
        reminders=reminder_cache,
        occurrence_start=occurrence_start,
        occurrence_end=occurrence_end,
    ), None


def _build_occurrence_instance(
    event: Any,
    occurrence_start: datetime,
    range_start: datetime,
    range_end: datetime,
    duration: Any,
    exception_dates: set[str],
    overrides_by_original: dict[datetime, Any],
    category_cache: list[Any],
    reminder_cache: list[dict[str, Any]],
) -> tuple[ExpandedEventInstance | None, int | None]:
    override = overrides_by_original.get(occurrence_start)
    if override is not None:
        return _build_override_occurrence(
            override,
            event,
            range_start,
            range_end,
            reminder_cache,
        )
    return _build_base_or_skipped_occurrence(
        event,
        occurrence_start,
        duration,
        exception_dates,
        range_start,
        range_end,
        category_cache,
        reminder_cache,
    )


def _build_base_or_skipped_occurrence(
    event: Any,
    occurrence_start: datetime,
    duration: Any,
    exception_dates: set[str],
    range_start: datetime,
    range_end: datetime,
    category_cache: list[Any],
    reminder_cache: list[dict[str, Any]],
) -> tuple[ExpandedEventInstance | None, int | None]:
    if occurrence_start.date().isoformat() in exception_dates:
        return None, None
    occurrence_end = occurrence_start + duration
    return _build_base_occurrence(
        event,
        occurrence_start,
        occurrence_end,
        range_start,
        range_end,
        category_cache,
        reminder_cache,
    )


def _build_standalone_override_instances(
    event: Any,
    loaded_overrides: list[Any],
    seen_override_ids: set[int],
    range_start: datetime,
    range_end: datetime,
    reminder_cache: list[dict[str, Any]],
) -> list[ExpandedEventInstance]:
    return [
        build_override_instance(event, override, reminder_cache=reminder_cache)
        for override in loaded_overrides
        if override.id not in seen_override_ids
        and range_start <= override.start_time <= range_end
    ]


def _collect_occurrence_instances(
    event: Any,
    range_start: datetime,
    range_end: datetime,
    duration: Any,
    exception_dates: set[str],
    overrides_by_original: dict[datetime, Any],
    category_cache: list[Any],
    reminder_cache: list[dict[str, Any]],
    occurrence_generator: Any,
) -> tuple[list[ExpandedEventInstance], set[int]]:
    instances: list[ExpandedEventInstance] = []
    seen_override_ids: set[int] = set()
    for occurrence_start in occurrence_generator(event, range_start, range_end):
        instance, seen_override_id = _build_occurrence_instance(
            event,
            occurrence_start,
            range_start,
            range_end,
            duration,
            exception_dates,
            overrides_by_original,
            category_cache,
            reminder_cache,
        )
        if seen_override_id is not None:
            seen_override_ids.add(seen_override_id)
        if instance is not None:
            instances.append(instance)
    return instances, seen_override_ids


def _append_standalone_overrides(
    instances: list[ExpandedEventInstance],
    event: Any,
    loaded_overrides: list[Any],
    seen_override_ids: set[int],
    range_start: datetime,
    range_end: datetime,
    reminder_cache: list[dict[str, Any]],
) -> None:
    instances.extend(
        _build_standalone_override_instances(
            event,
            loaded_overrides,
            seen_override_ids,
            range_start,
            range_end,
            reminder_cache,
        )
    )


def _build_sorted_instances(
    event: Any,
    content: tuple[Any, ...],
    occurrence_generator: Any,
) -> list[ExpandedEventInstance]:
    unpacked_content = _unpack_expanded_content(content)
    instances, seen_override_ids = _collect_occurrence_instances(
        event,
        unpacked_content["range_start"],
        unpacked_content["range_end"],
        unpacked_content["duration"],
        unpacked_content["exception_dates"],
        unpacked_content["overrides_by_original"],
        unpacked_content["category_cache"],
        unpacked_content["reminder_cache"],
        occurrence_generator,
    )
    _append_standalone_overrides(
        instances,
        event,
        unpacked_content["loaded_overrides"],
        seen_override_ids,
        unpacked_content["range_start"],
        unpacked_content["range_end"],
        unpacked_content["reminder_cache"],
    )
    return sorted(instances, key=lambda instance: instance.start_time)


def _unpack_expanded_content(content: tuple[Any, ...]) -> dict[str, Any]:
    (
        range_start,
        range_end,
        category_cache,
        reminder_cache,
        duration,
        exception_dates,
        loaded_overrides,
        overrides_by_original,
    ) = content
    return {
        "range_start": range_start,
        "range_end": range_end,
        "category_cache": category_cache,
        "reminder_cache": reminder_cache,
        "duration": duration,
        "exception_dates": exception_dates,
        "loaded_overrides": loaded_overrides,
        "overrides_by_original": overrides_by_original,
    }


def expand_event_instances(
    event: Any,
    range_start: datetime,
    range_end: datetime,
    *,
    overrides: list[Any] | None = None,
    occurrence_generator: Any = _generate_occurrence_starts,
) -> list[ExpandedEventInstance]:
    content = _build_expanded_content(event, range_start, range_end, overrides)
    return _build_sorted_instances(event, content, occurrence_generator)
