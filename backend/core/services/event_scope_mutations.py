from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

from django.db import transaction
from django.utils import timezone

from core.models import Event, EventOverride, EventReminder
from core.services.recurrence_instances import (
    is_occurrence_in_series,
    serialise_event_reminders,
)


EVENT_FIELD_NAMES = (
    "title",
    "description",
    "location",
    "start_time",
    "end_time",
    "recurrence_interval",
    "recurrence_end",
)


def _make_aware(value: datetime) -> datetime:
    if timezone.is_aware(value):
        return value
    return timezone.make_aware(value)


def _normalise_reminders(
    reminders_data: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    if reminders_data is None:
        return []
    normalised: list[dict[str, Any]] = []
    for reminder in reminders_data:
        normalised.append(
            {
                "send_email": bool(reminder.get("send_email", False)),
                "send_push": bool(reminder.get("send_push", False)),
                "minutes_before": int(reminder.get("minutes_before", 0)),
            }
        )
    return normalised


def _current_event_reminder_snapshot(event: Event) -> list[dict[str, Any]]:
    reminder_rows = serialise_event_reminders(event)
    return [
        {
            "send_email": bool(reminder["send_email"]),
            "send_push": bool(reminder["send_push"]),
            "minutes_before": int(reminder["minutes_before"]),
        }
        for reminder in reminder_rows
    ]


def _replace_event_reminders(
    event: Event,
    reminders_data: list[dict[str, Any]] | None,
) -> None:
    if reminders_data is None:
        return

    event.reminders.all().delete()
    for reminder in _normalise_reminders(reminders_data):
        EventReminder.objects.create(event=event, **reminder)


def _set_exception_date(event: Event, exception_date: date) -> None:
    current = set(event.exception_dates or [])
    current.add(exception_date.isoformat())
    event.exception_dates = sorted(current)
    event.save(update_fields=["exception_dates"])


def _remove_exception_date(event: Event, exception_date: date) -> None:
    current = set(event.exception_dates or [])
    value = exception_date.isoformat()
    if value not in current:
        return
    current.remove(value)
    event.exception_dates = sorted(current)
    event.save(update_fields=["exception_dates"])


def _category_id_set(values: Any) -> set[int]:
    ids: set[int] = set()
    for value in values:
        if hasattr(value, "id"):
            ids.add(int(value.id))
        else:
            ids.add(int(value))
    return ids


def _canonicalise_reminders(
    reminders_data: list[dict[str, Any]],
) -> list[tuple[int, bool, bool]]:
    return sorted(
        (
            int(reminder["minutes_before"]),
            bool(reminder["send_email"]),
            bool(reminder["send_push"]),
        )
        for reminder in reminders_data
    )


def _has_recurrence_pattern_change(
    event: Event, validated_data: dict[str, Any]
) -> bool:
    interval_changed = (
        "recurrence_interval" in validated_data
        and validated_data["recurrence_interval"] != event.recurrence_interval
    )
    recurrence_end_changed = (
        "recurrence_end" in validated_data
        and validated_data["recurrence_end"] != event.recurrence_end
    )
    return interval_changed or recurrence_end_changed


def _split_exception_dates(
    exception_dates: list[str] | None,
    threshold: date,
) -> tuple[list[str], list[str]]:
    past: list[str] = []
    future: list[str] = []
    for value in exception_dates or []:
        try:
            parsed = date.fromisoformat(value)
        except ValueError:
            continue
        if parsed >= threshold:
            future.append(value)
        else:
            past.append(value)
    return past, future


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
    if "end_time" in validated_data:
        submitted_end = _make_aware(validated_data["end_time"])
    elif "start_time" in validated_data:
        submitted_end = submitted_start + (occurrence_end - occurrence_start)
    else:
        submitted_end = occurrence_end

    return anchor_time, occurrence_start, submitted_start, submitted_end


def _align_to_date(source: datetime, target_date: date) -> datetime:
    return datetime.combine(target_date, source.timetz())


def _normalise_shift_and_duration(
    occurrence_start: datetime,
    submitted_start: datetime,
    submitted_end: datetime,
) -> tuple[timedelta, timedelta]:
    # For scope="all" and scope="following", preserve series anchor dates and
    # apply only time-of-day/duration changes from the edited occurrence payload.
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
        _resolve_submitted_occurrence_window(
            event,
            validated_data,
            original_start_time,
        )
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
        _resolve_submitted_occurrence_window(
            event,
            validated_data,
            original_start_time,
        )
    )
    shift, duration = _normalise_shift_and_duration(
        occurrence_start,
        submitted_start,
        submitted_end,
    )
    child_start = anchor_time + shift
    child_end = child_start + duration
    return child_start, child_end


def _detach_non_aligned_overrides(event: Event) -> None:
    detached_exception_dates: set[str] = set()
    overrides = list(event.overrides.prefetch_related("categories").all())
    for override in overrides:
        if is_occurrence_in_series(event, override.original_start_time):
            continue

        detached = Event.objects.create(
            user=event.user,
            title=override.title,
            description=override.description,
            location=override.location,
            start_time=override.start_time,
            end_time=override.end_time,
            recurrence_interval=None,
            recurrence_end=None,
            exception_dates=[],
        )
        detached.categories.set(override.categories.all())
        for reminder in _normalise_reminders(override.reminders_snapshot):
            EventReminder.objects.create(event=detached, **reminder)

        detached_exception_dates.add(override.original_start_time.date().isoformat())
        override.delete()

    if detached_exception_dates:
        event.exception_dates = sorted(
            [
                value
                for value in (event.exception_dates or [])
                if value not in detached_exception_dates
            ]
        )
        event.save(update_fields=["exception_dates"])


def _update_scope_all(
    event: Event,
    validated_data: dict[str, Any],
    original_start_time: datetime | None = None,
) -> Event:
    normalised_data = validated_data
    if event.recurrence_interval:
        anchor_time = original_start_time or event.start_time
        normalised_data = _normalise_all_scope_datetimes(
            event,
            validated_data,
            anchor_time,
        )

    for field_name in EVENT_FIELD_NAMES:
        if field_name in normalised_data:
            setattr(event, field_name, normalised_data[field_name])
    event.save()

    if "categories" in normalised_data:
        event.categories.set(normalised_data["categories"])
    _replace_event_reminders(event, normalised_data.get("reminders"))

    _detach_non_aligned_overrides(event)
    return event


def _update_scope_this(
    event: Event,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> Event:
    original_start_time = _make_aware(original_start_time)
    duration = event.end_time - event.start_time
    existing_override = (
        event.overrides.filter(original_start_time=original_start_time)
        .prefetch_related("categories")
        .first()
    )

    title = _field_value(
        validated_data,
        "title",
        fallback=existing_override.title if existing_override else event.title,
    )
    description = _field_value(
        validated_data,
        "description",
        fallback=existing_override.description
        if existing_override
        else event.description,
    )
    location = _field_value(
        validated_data,
        "location",
        fallback=existing_override.location if existing_override else event.location,
    )
    start_time = _field_value(
        validated_data,
        "start_time",
        fallback=(
            existing_override.start_time if existing_override else original_start_time
        ),
    )
    end_time = _field_value(
        validated_data,
        "end_time",
        fallback=(
            existing_override.end_time
            if existing_override
            else original_start_time + duration
        ),
    )

    if existing_override is None:
        override = EventOverride(
            parent_event=event,
            original_start_time=original_start_time,
            title=title,
            description=description,
            location=location,
            start_time=start_time,
            end_time=end_time,
        )
    else:
        override = existing_override
        override.title = title
        override.description = description
        override.location = location
        override.start_time = start_time
        override.end_time = end_time

    if "reminders" in validated_data:
        final_reminders = _normalise_reminders(validated_data["reminders"])
    elif existing_override and existing_override.reminders_snapshot:
        final_reminders = _normalise_reminders(existing_override.reminders_snapshot)
    else:
        final_reminders = _current_event_reminder_snapshot(event)

    if "categories" in validated_data:
        final_category_ids = _category_id_set(validated_data["categories"])
    elif existing_override is None:
        final_category_ids = _category_id_set(event.categories.all())
    else:
        final_category_ids = _category_id_set(existing_override.categories.all())

    base_category_ids = _category_id_set(event.categories.all())
    base_reminders = _current_event_reminder_snapshot(event)
    base_end = original_start_time + duration
    is_noop_override = (
        title == event.title
        and description == event.description
        and location == event.location
        and start_time == original_start_time
        and end_time == base_end
        and final_category_ids == base_category_ids
        and _canonicalise_reminders(final_reminders)
        == _canonicalise_reminders(base_reminders)
    )
    if is_noop_override:
        if existing_override is not None:
            existing_override.delete()
        _remove_exception_date(event, original_start_time.date())
        return event

    override.reminders_snapshot = final_reminders
    override.save()

    override.categories.set(final_category_ids)

    _set_exception_date(event, original_start_time.date())
    return event


def _update_scope_following(
    event: Event,
    validated_data: dict[str, Any],
    original_start_time: datetime,
) -> Event:
    original_start_time = _make_aware(original_start_time)
    original_date = original_start_time.date()
    old_recurrence_end = event.recurrence_end

    parent_categories = list(event.categories.all())
    parent_reminders = _current_event_reminder_snapshot(event)
    past_exception_dates, future_exception_dates = _split_exception_dates(
        event.exception_dates,
        original_date,
    )

    child_start, child_end = _normalise_following_child_window(
        event,
        validated_data,
        original_start_time,
    )

    child = Event.objects.create(
        user=event.user,
        title=_field_value(validated_data, "title", fallback=event.title),
        description=_field_value(
            validated_data,
            "description",
            fallback=event.description,
        ),
        location=_field_value(validated_data, "location", fallback=event.location),
        start_time=child_start,
        end_time=child_end,
        recurrence_interval=_field_value(
            validated_data,
            "recurrence_interval",
            fallback=event.recurrence_interval,
        ),
        recurrence_end=_field_value(
            validated_data,
            "recurrence_end",
            fallback=old_recurrence_end,
        ),
        exception_dates=future_exception_dates,
        split_from_event=event,
    )

    categories_for_child = validated_data.get("categories", parent_categories)
    child.categories.set(categories_for_child)

    reminders_for_child = validated_data.get("reminders", parent_reminders)
    for reminder in _normalise_reminders(reminders_for_child):
        EventReminder.objects.create(event=child, **reminder)

    future_overrides = list(
        event.overrides.filter(original_start_time__date__gte=original_date)
    )
    for override in future_overrides:
        override.parent_event = child
        override.save(update_fields=["parent_event"])

    cutoff = original_date - timedelta(days=1)
    if cutoff < event.start_time.date():
        event.delete()
    else:
        event.recurrence_end = cutoff
        event.exception_dates = past_exception_dates
        event.save(update_fields=["recurrence_end", "exception_dates"])

    return child


def _delete_scope_this(event: Event, original_start_time: datetime) -> None:
    original_start_time = _make_aware(original_start_time)
    event.overrides.filter(original_start_time=original_start_time).delete()
    _set_exception_date(event, original_start_time.date())


def _delete_scope_following(event: Event, original_start_time: datetime) -> None:
    original_start_time = _make_aware(original_start_time)
    original_date = original_start_time.date()

    cutoff = original_date - timedelta(days=1)
    event.overrides.filter(original_start_time__date__gte=original_date).delete()

    past_exception_dates, _ = _split_exception_dates(
        event.exception_dates, original_date
    )
    if cutoff < event.start_time.date():
        event.delete()
        return

    event.recurrence_end = cutoff
    event.exception_dates = past_exception_dates
    event.save(update_fields=["recurrence_end", "exception_dates"])


@transaction.atomic
def apply_update_scope(
    event: Event,
    validated_data: dict[str, Any],
    scope: str,
    original_start_time: datetime | None = None,
) -> Event:
    if not event.recurrence_interval:
        return _update_scope_all(event, validated_data)

    if scope == "this":
        if original_start_time is None:
            raise ValueError("original_start_time is required for scope='this'.")
        if _has_recurrence_pattern_change(event, validated_data):
            raise ValueError(
                "Recurrence pattern changes are not supported for scope='this'. "
                "Use scope='following' or scope='all'."
            )
        return _update_scope_this(event, validated_data, original_start_time)
    if scope == "following":
        if original_start_time is None:
            raise ValueError("original_start_time is required for scope='following'.")
        return _update_scope_following(event, validated_data, original_start_time)
    return _update_scope_all(event, validated_data, original_start_time)


@transaction.atomic
def apply_delete_scope(
    event: Event,
    scope: str,
    original_start_time: datetime | None = None,
) -> None:
    if not event.recurrence_interval or scope == "all":
        event.delete()
        return

    if scope == "this":
        if original_start_time is None:
            raise ValueError("original_start_time is required for scope='this'.")
        _delete_scope_this(event, original_start_time)
        return

    if scope == "following":
        if original_start_time is None:
            raise ValueError("original_start_time is required for scope='following'.")
        _delete_scope_following(event, original_start_time)
        return

    event.delete()


@transaction.atomic
def revert_override_instance(event: Event, original_start_time: datetime) -> None:
    if not event.recurrence_interval:
        raise ValueError("Only recurring events can revert overridden instances.")

    original_start_time = _make_aware(original_start_time)
    deleted_count, _ = event.overrides.filter(
        original_start_time=original_start_time
    ).delete()
    if deleted_count == 0:
        raise ValueError("No override exists for the provided original_start_time.")
    _remove_exception_date(event, original_start_time.date())
