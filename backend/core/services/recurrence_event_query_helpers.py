from __future__ import annotations

from datetime import datetime
from typing import Any

from django.db.models import Prefetch, Q

from core.models import Event, EventOverride


def _build_user_event_filter(range_start: datetime, range_end: datetime) -> Q:
    return Q(
        recurrence_interval__isnull=True,
        start_time__lte=range_end,
        end_time__gte=range_start,
    ) | (
        Q(recurrence_interval__isnull=False)
        & Q(start_time__lte=range_end)
        & (Q(recurrence_end__isnull=True) | Q(recurrence_end__gte=range_start.date()))
    )


def _get_events_for_user(user: Any, event_filter: Q):
    return (
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


def _expand_prefetched_events(
    events,
    range_start: datetime,
    range_end: datetime,
    expand_event_instances,
):
    instances = []
    for event in events:
        instances.extend(
            expand_event_instances(
                event,
                range_start,
                range_end,
                overrides=list(event.overrides.all()),
            )
        )
    return instances
