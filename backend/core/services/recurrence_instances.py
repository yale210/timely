from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time
from typing import Any, Iterable

from dateutil.rrule import DAILY, MONTHLY, WEEKLY, YEARLY, rrule
from django.db.models import Prefetch, Q
from django.utils import timezone

from core.models import Event, EventOverride


@dataclass(frozen=True)
class ExpandedEventInstance:
    """
    Represents a single occurrence of an event after recurrence rules
    and overrides have been applied.
    """

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


FREQ_BY_INTERVAL = {
    Event.RecurrenceInterval.DAILY: DAILY,
    Event.RecurrenceInterval.WEEKLY: WEEKLY,
    Event.RecurrenceInterval.MONTHLY: MONTHLY,
    Event.RecurrenceInterval.YEARLY: YEARLY,
}


def _make_aware(value: datetime) -> datetime:
    if timezone.is_aware(value):
        return value
    return timezone.make_aware(value)


def _normalise_reminder_snapshot(
    reminders_snapshot: Iterable[dict[str, Any]],
) -> list[dict[str, Any]]:
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


def serialise_event_reminders(event: Event) -> list[dict[str, Any]]:
    """
    Serialise the reminders into a consistent format to be used for event overrides.
    """
    return [
        {
            "id": reminder.id,
            "send_email": reminder.send_email,
            "send_push": reminder.send_push,
            "minutes_before": reminder.minutes_before,
        }
        for reminder in event.reminders.all().order_by("minutes_before", "id")
    ]


def _get_event_rule_until(event: Event, window_end: datetime) -> datetime:
    if not event.recurrence_end:
        return window_end

    series_tz = event.start_time.tzinfo or timezone.get_current_timezone()
    recurrence_end_dt = datetime.combine(event.recurrence_end, time.max)
    if timezone.is_naive(recurrence_end_dt):
        recurrence_end_dt = timezone.make_aware(recurrence_end_dt, series_tz)
    return min(recurrence_end_dt, window_end)


def _build_event_rrule(event: Event, window_end: datetime) -> rrule | None:
    if not event.recurrence_interval:
        return None
    frequency = FREQ_BY_INTERVAL.get(event.recurrence_interval)
    if frequency is None:
        return None
    until = _get_event_rule_until(event, window_end)
    if until < event.start_time:
        return None
    return rrule(
        frequency,
        dtstart=event.start_time,
        until=until,
    )


def _generate_occurrence_starts(
    event: Event, range_start: datetime, range_end: datetime
) -> list[datetime]:
    if not event.recurrence_interval:
        if event.start_time <= range_end and event.end_time >= range_start:
            return [event.start_time]
        return []

    if event.start_time > range_end:
        return []

    rule = _build_event_rrule(event, range_end)
    if rule is None:
        return []
    return [dt for dt in rule.between(range_start, range_end, inc=True)]


def is_occurrence_in_series(event: Event, occurrence_start: datetime) -> bool:
    """
    Check if a datetime corresponds to a valid event occurence based on recurrence rules.
    """
    occurrence_start = _make_aware(occurrence_start)

    if not event.recurrence_interval:
        return event.start_time == occurrence_start

    if occurrence_start < event.start_time:
        return False
    if event.recurrence_end and occurrence_start.date() > event.recurrence_end:
        return False

    rule = _build_event_rrule(event, occurrence_start)
    if rule is None:
        return False
    previous = rule.before(occurrence_start, inc=True)
    return previous == occurrence_start


def _build_instance_id(
    source_event_id: int,
    is_override: bool,
    anchor_time: datetime | None,
    start_time: datetime,
) -> str:
    anchor = (anchor_time or start_time).isoformat()
    kind = "override" if is_override else "base"
    return f"{source_event_id}:{anchor}:{kind}"


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
    return ExpandedEventInstance(
        id=source_event.id,
        title=title,
        description=description,
        location=location,
        colour=colour,
        categories=categories,
        start_time=start_time,
        end_time=end_time,
        recurrence_interval=source_event.recurrence_interval,
        recurrence_end=source_event.recurrence_end,
        reminders=reminders,
        is_override=is_override,
        source_event_id=source_event.id,
        original_start_time=original_start_time,
        instance_id=_build_instance_id(
            source_event.id,
            is_override,
            original_start_time,
            start_time,
        ),
        is_split_series=source_event.split_from_event_id is not None,
        split_from_event_id=source_event.split_from_event_id,
    )


def _build_expanded_content(
    event: Event,
    range_start: datetime,
    range_end: datetime,
    overrides: list[EventOverride] | None,
):
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


def expand_event_instances(
    event: Event,
    range_start: datetime,
    range_end: datetime,
    *,
    overrides: list[EventOverride] | None = None,
) -> list[ExpandedEventInstance]:
    """
    Expand a single Event into concrete event instances within the given time
    range, applying any relevant overrides or exceptions required.
    """

    (
        range_start,
        range_end,
        category_cache,
        reminder_cache,
        duration,
        exception_dates,
        loaded_overrides,
        overrides_by_original,
    ) = _build_expanded_content(event, range_start, range_end, overrides)

    seen_override_ids: set[int] = set()
    instances: list[ExpandedEventInstance] = []

    for occurrence_start in _generate_occurrence_starts(event, range_start, range_end):
        override = overrides_by_original.get(occurrence_start)
        if override:
            seen_override_ids.add(override.id)
            if range_start <= override.start_time <= range_end:
                instances.append(
                    _build_expanded_instance(
                        source_event=event,
                        categories=list(override.categories.all()),
                        reminders=_normalise_reminder_snapshot(
                            override.reminders_snapshot or reminder_cache
                        ),
                        start_time=override.start_time,
                        end_time=override.end_time,
                        is_override=True,
                        original_start_time=override.original_start_time,
                        title=override.title,
                        description=override.description,
                        location=override.location,
                        colour=override.colour or event.colour,
                    )
                )
            continue

        if occurrence_start.date().isoformat() in exception_dates:
            continue

        occurrence_end = occurrence_start + duration
        if range_start <= occurrence_start <= range_end or (
            not event.recurrence_interval
            and occurrence_start <= range_end
            and occurrence_end >= range_start
        ):
            instances.append(
                _build_expanded_instance(
                    source_event=event,
                    categories=category_cache,
                    reminders=reminder_cache,
                    start_time=occurrence_start,
                    end_time=occurrence_end,
                    is_override=False,
                    original_start_time=(
                        occurrence_start if event.recurrence_interval else None
                    ),
                    title=event.title,
                    description=event.description,
                    location=event.location,
                    colour=event.colour,
                )
            )

    for override in loaded_overrides:
        if override.id in seen_override_ids:
            continue
        if not (range_start <= override.start_time <= range_end):
            continue
        instances.append(
            _build_expanded_instance(
                source_event=event,
                categories=list(override.categories.all()),
                reminders=_normalise_reminder_snapshot(
                    override.reminders_snapshot or reminder_cache
                ),
                start_time=override.start_time,
                end_time=override.end_time,
                is_override=True,
                original_start_time=override.original_start_time,
                title=override.title,
                description=override.description,
                location=override.location,
                colour=override.colour or event.colour,
            )
        )

    return sorted(instances, key=lambda instance: instance.start_time)


def expand_user_events(
    user: Any,
    range_start: datetime,
    range_end: datetime,
) -> list[ExpandedEventInstance]:
    """
    Expand all events for a given user into concrete instances
    within the specified time range.
    """

    range_start = _make_aware(range_start)
    range_end = _make_aware(range_end)

    event_filter = Q(
        recurrence_interval__isnull=True,
        start_time__lte=range_end,
        end_time__gte=range_start,
    ) | (
        Q(recurrence_interval__isnull=False)
        & Q(start_time__lte=range_end)
        & (Q(recurrence_end__isnull=True) | Q(recurrence_end__gte=range_start.date()))
    )

    events = (
        Event.objects.filter(user=user)
        .filter(event_filter)
        .prefetch_related(
            "categories",
            "reminders",
            Prefetch(
                "overrides",
                queryset=EventOverride.objects.prefetch_related("categories").all(),
            ),
        )
        .order_by("start_time", "id")
    )

    instances: list[ExpandedEventInstance] = []
    for event in events:
        instances.extend(
            expand_event_instances(
                event,
                range_start,
                range_end,
                overrides=list(event.overrides.all()),
            )
        )

    return sorted(instances, key=lambda instance: instance.start_time)
