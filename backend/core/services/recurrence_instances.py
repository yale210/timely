from datetime import datetime
from typing import Any

from core.services.recurrence_event_query_helpers import (
    _build_user_event_filter,
    _expand_prefetched_events,
    _get_events_for_user,
)
from core.services.recurrence_expansion_helpers import (
    expand_event_instances as _expand_event_instances_impl,
)
from core.services.recurrence_instance_builders import (
    ExpandedEventInstance,
)
from core.services.recurrence_instance_builders import (
    normalise_reminder_snapshot as _normalise_reminder_snapshot,
)
from core.services.recurrence_rule_helpers import (
    _build_event_rrule,
    _generate_occurrence_starts,
    _get_event_rule_until,
    _make_aware,
    is_occurrence_in_series,
    serialise_event_reminders,
)

__all__ = (
    "_normalise_reminder_snapshot",
    "_build_event_rrule",
    "_generate_occurrence_starts",
    "_get_event_rule_until",
    "_make_aware",
    "expand_event_instances",
    "expand_user_events",
    "is_occurrence_in_series",
    "serialise_event_reminders",
)


def expand_event_instances(
    event: Any,
    range_start: datetime,
    range_end: datetime,
    *,
    overrides: list[Any] | None = None,
) -> list[ExpandedEventInstance]:
    """Expand one event into recurrence-aware instances.

    Returns:
        list[ExpandedEventInstance]: Expanded instances within the requested range.
    """
    return _expand_event_instances_impl(
        event,
        range_start,
        range_end,
        overrides=overrides,
        occurrence_generator=_generate_occurrence_starts,
    )


def expand_user_events(
    user: Any,
    range_start: datetime,
    range_end: datetime,
) -> list[ExpandedEventInstance]:
    """Expand all visible events for a user within a date range.

    Returns:
        list[ExpandedEventInstance]: Sorted instances for the user.
    """
    range_start = _make_aware(range_start)
    range_end = _make_aware(range_end)
    event_filter = _build_user_event_filter(range_start, range_end)
    events = _get_events_for_user(user, event_filter)
    instances = _expand_prefetched_events(
        events, range_start, range_end, expand_event_instances
    )
    return sorted(instances, key=lambda instance: instance.start_time)
