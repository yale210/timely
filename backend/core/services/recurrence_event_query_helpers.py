"""Helper functions for querying and filtering events during recurrence expansion.

This module provides utility functions to build complex Django queries for
finding relevant event series and their overrides, as well as functions to
bulk-expand a set of prefetched events.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from django.db.models import Prefetch, Q

from core.models import Event, EventOverride


def _build_user_event_filter(range_start: datetime, range_end: datetime) -> Q:
    """Construct a Django Q object to filter events visible within a time window.

    Includes both non-recurring events that overlap the window and recurring
    events whose series start before the window end and either have no end
    or end after the window start.

    Args:
        range_start (datetime): Start of the visible window.
        range_end (datetime): End of the visible window.

    Returns:
        Q: A Django query object.

    """
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
    """Retrieve a queryset of events for a user with prefetched relationships.

    Args:
        user (Any): The user instance or ID.
        event_filter (Q): The pre-built visibility filter.

    Returns:
        QuerySet: A Django queryset of Event objects.

    """
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
    """Iterate over a collection of events and expand each into instances.

    Args:
        events (Iterable): A collection of pre-fetched Event objects.
        range_start (datetime): Window start.
        range_end (datetime): Window end.
        expand_event_instances (Callable): The expansion function to apply.

    Returns:
        list: A flat list of ExpandedEventInstance objects.

    """
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
