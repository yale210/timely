from datetime import datetime, time, timedelta
from typing import Any, cast

from django.utils import timezone
from rest_framework import serializers

from core.calendar_validation_helpers import (
    _iter_other_blocked_slots,
    _validate_calendar_attrs,
)
from core.models import Event, Task


class CalendarValidationMixin(serializers.Serializer):
    """Shared validation logic for calendar task serializers."""

    BUFFER_CONFLICT_MESSAGES = {
        "Allocation slots and their task buffers cannot overlap calendar events.": (
            "This buffer conflicts with the task's current scheduled time because it would overlap a calendar event. Reschedule or unschedule the task first."
        ),
        "Allocation slots and task buffers cannot overlap other tasks.": (
            "This buffer conflicts with the task's current scheduled time because it would overlap another scheduled task. Reschedule or unschedule the task first."
        ),
    }

    @staticmethod
    def _aware(dt: datetime) -> datetime:
        if timezone.is_naive(dt):
            return timezone.make_aware(dt)
        return dt

    def _resolve_user(self):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            return request.user
        if self.instance is not None:
            return self.instance.user
        return None

    def _parse_allocation_slots(self, allocation):
        normalised = []
        errors = []
        for index, slot in enumerate(allocation):
            parsed_slot = self._normalise_allocation_slot(index, slot)
            if isinstance(parsed_slot, dict):
                errors.append(parsed_slot)
                continue
            normalised.append(parsed_slot)
        return normalised, errors

    def _normalise_allocation_slot(self, index, slot):
        if not isinstance(slot, dict):
            return {index: "Each allocation slot must be an object."}

        start_raw = slot.get("start")
        end_raw = slot.get("end")
        if not start_raw or not end_raw:
            return {index: 'Each allocation slot must include "start" and "end".'}

        try:
            start = self._aware(datetime.fromisoformat(str(start_raw)))
            end = self._aware(datetime.fromisoformat(str(end_raw)))
        except ValueError:
            return {index: "Allocation slots must use valid ISO 8601 datetimes."}

        if end <= start:
            return {index: "Allocation slot end time must be after start time."}
        return start, end

    @staticmethod
    def _overlaps(left_start, left_end, right_start, right_end):
        return left_start < right_end and left_end > right_start

    @staticmethod
    def _expand_with_buffer(
        slot_start, slot_end, buffer_before_minutes, buffer_after_minutes
    ):
        return (
            slot_start - timedelta(minutes=buffer_before_minutes),
            slot_end + timedelta(minutes=buffer_after_minutes),
        )

    @staticmethod
    def _next_midnight(cursor):
        return datetime.combine(
            cursor.date() + timedelta(days=1),
            time.min,
            tzinfo=cursor.tzinfo,
        )

    @staticmethod
    def _add_minutes(minutes_by_day, day, minutes):
        if minutes > 0:
            minutes_by_day[day] = minutes_by_day.get(day, 0) + minutes

    def _minutes_by_day(self, slots):
        minutes_by_day = {}
        for start, end in slots:
            cursor = start
            while cursor < end:
                segment_end = min(end, self._next_midnight(cursor))
                minutes = int((segment_end - cursor).total_seconds() // 60)
                self._add_minutes(minutes_by_day, cursor.date(), minutes)
                cursor = segment_end
        return minutes_by_day

    def _validate_category_limits(self, user, categories, normalised_slots):
        if not user or not normalised_slots:
            return

        limited_categories = self._limited_categories(categories)
        if not limited_categories:
            return

        requested_minutes_by_day = self._minutes_by_day(normalised_slots)
        current_task_id = getattr(self.instance, "id", None)
        for category in limited_categories:
            existing_minutes_by_day = self._existing_category_minutes_by_day(
                user,
                category,
                current_task_id,
            )
            self._ensure_category_capacity(
                category,
                existing_minutes_by_day,
                requested_minutes_by_day,
            )

    @staticmethod
    def _limited_categories(categories):
        return [
            category
            for category in categories
            if category.max_daily_study_time is not None
        ]

    def _existing_category_minutes_by_day(self, user, category, current_task_id):
        minutes_by_day = {}
        other_tasks = (
            cast(Any, Task)
            .objects.filter(user=user, categories=category)
            .exclude(id=current_task_id)
            .exclude(allocation=[])
            .distinct()
        )
        for task in other_tasks:
            self._merge_minutes_by_day(minutes_by_day, self._task_minutes_by_day(task))
        return minutes_by_day

    def _task_minutes_by_day(self, task):
        task_slots, _ = self._parse_allocation_slots(task.allocation or [])
        return self._minutes_by_day(task_slots)

    @staticmethod
    def _merge_minutes_by_day(existing_minutes_by_day, added_minutes_by_day):
        for day, minutes in added_minutes_by_day.items():
            existing_minutes_by_day[day] = existing_minutes_by_day.get(day, 0) + minutes

    def _ensure_category_capacity(
        self,
        category,
        existing_minutes_by_day,
        requested_minutes_by_day,
    ):
        for day, minutes in requested_minutes_by_day.items():
            total_minutes = existing_minutes_by_day.get(day, 0) + minutes
            if total_minutes > int(category.max_daily_study_time):
                raise serializers.ValidationError(
                    {
                        "allocation": (
                            f'Category "{category.text}" exceeds its daily limit on '
                            f"{day.isoformat()}."
                        )
                    }
                )

    def _validate_external_conflicts(
        self,
        normalised_slots,
        buffer_before_minutes,
        buffer_after_minutes,
        categories,
    ):
        user = self._resolve_user()
        if user is None:
            return

        current_task_id = getattr(self.instance, "id", None)
        events = list(cast(Any, Event).objects.filter(user=user))
        other_tasks = list(
            cast(Any, Task)
            .objects.filter(user=user)
            .exclude(id=current_task_id)
            .exclude(allocation=[])
        )
        for slot_start, slot_end in normalised_slots:
            blocked_slot = self._expand_with_buffer(
                slot_start,
                slot_end,
                buffer_before_minutes,
                buffer_after_minutes,
            )
            self._validate_event_conflicts(blocked_slot, events)
            self._validate_task_conflicts(blocked_slot, other_tasks)

        self._validate_category_limits(user, categories, normalised_slots)

    def _validate_event_conflicts(self, blocked_slot, events):
        blocked_start, blocked_end = blocked_slot
        for event in events:
            event_start = self._aware(event.start_time)
            event_end = self._aware(event.end_time)
            if self._overlaps(blocked_start, blocked_end, event_start, event_end):
                raise serializers.ValidationError(
                    {
                        "allocation": (
                            "Allocation slots and their task buffers cannot overlap calendar events."
                        )
                    }
                )

    def _validate_task_conflicts(self, blocked_slot, other_tasks):
        blocked_start, blocked_end = blocked_slot
        for other_blocked_start, other_blocked_end in _iter_other_blocked_slots(
            self,
            other_tasks,
        ):
            if self._overlaps(
                blocked_start,
                blocked_end,
                other_blocked_start,
                other_blocked_end,
            ):
                raise serializers.ValidationError(
                    {
                        "allocation": (
                            "Allocation slots and task buffers cannot overlap other tasks."
                        )
                    }
                )

    def _rewrite_buffer_only_conflict(self, attrs, exc):
        if self.instance is None or "allocation" in attrs:
            return exc
        if not ("buffer_before_minutes" in attrs or "buffer_after_minutes" in attrs):
            return exc
        if not (self.instance.allocation or []):
            return exc

        allocation_error = exc.detail.get("allocation")
        if isinstance(allocation_error, list) and len(allocation_error) == 1:
            allocation_error = allocation_error[0]
        if allocation_error is None:
            return exc

        message = self.BUFFER_CONFLICT_MESSAGES.get(str(allocation_error))
        if not message:
            return exc

        field_errors = {}
        if "buffer_before_minutes" in attrs:
            field_errors["buffer_before_minutes"] = message
        if "buffer_after_minutes" in attrs:
            field_errors["buffer_after_minutes"] = message
        return serializers.ValidationError(field_errors)

    def validate(self, attrs):
        """Validate calendar task data while preserving existing serializer behaviour.

        Returns:
            dict: The validated calendar task data.
        """
        attrs = super().validate(attrs)
        return _validate_calendar_attrs(self, attrs)
