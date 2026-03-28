"""Serializers and validation helpers for calendar task data."""

from datetime import datetime, time, timedelta

from django.utils import timezone
from rest_framework import serializers

from core.models import Category, Event, Task

from .category_serializer import CategorySerializer


class CalendarSerializer(serializers.ModelSerializer):
    """Serializer for the calendar ."""

    BUFFER_CONFLICT_MESSAGES = {
        "Allocation slots and their task buffers cannot overlap calendar events.": (
            "This buffer conflicts with the task's current scheduled time because it would overlap a calendar event. Reschedule or unschedule the task first."
        ),
        "Allocation slots and task buffers cannot overlap other tasks.": (
            "This buffer conflicts with the task's current scheduled time because it would overlap another scheduled task. Reschedule or unschedule the task first."
        ),
    }

    categories = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Category.objects.all(), required=False
    )
    remaining_minutes = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "categories",
            "colour",
            "estimated_minutes",
            "completed_minutes",
            "remaining_minutes",
            "start_time",
            "deadline",
            "importance",
            "completed",
            "locked",
            "allow_split",
            "min_split_minutes",
            "max_split_minutes",
            "buffer_before_minutes",
            "buffer_after_minutes",
            "parent_task",
            "allocation",
            "total_task_allocations",
        ]
        read_only_fields = ["total_task_allocations"]

    def to_representation(self, instance):
        """Convert the Task instance into dictionary.

        Args:
            instance (Task): The Task instance to be converted to a dictionary.

        Returns:
            dict: The representation of the Task instance.
        """
        representation = super().to_representation(instance)
        representation["categories"] = CategorySerializer(
            instance.categories.all(), many=True
        ).data
        return representation

    def get_remaining_minutes(self, instance):
        """Calculate the remaining minutes for a task.

        Args:
            instance (Task): The task instance.

        Returns:
            int: The remaining minutes after calculation.
        """
        return max(0, instance.estimated_minutes - instance.completed_minutes)

    def __init__(self, *args, **kwargs):
        """Enable filtering of categories based on the user.

        Args:
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.
        """
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            self.fields["categories"].queryset = Category.objects.filter(
                user=request.user
            )
        else:
            self.fields["categories"].queryset = Category.objects.none()

    @staticmethod
    def _aware(dt: datetime) -> datetime:
        """Ensure datetimes are timezone-aware before comparison."""
        if timezone.is_naive(dt):
            return timezone.make_aware(dt)
        return dt

    def _resolve_user(self):
        """Resolve the effective user from the request context or bound instance."""
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            return request.user
        if self.instance is not None:
            return self.instance.user
        return None

    def _parse_allocation_slots(self, allocation):
        """Normalise allocation slots and collect per-slot validation errors."""
        normalized = []
        errors = []
        for index, slot in enumerate(allocation):
            if not isinstance(slot, dict):
                errors.append({index: "Each allocation slot must be an object."})
                continue
            start_raw = slot.get("start")
            end_raw = slot.get("end")
            if not start_raw or not end_raw:
                errors.append(
                    {index: 'Each allocation slot must include "start" and "end".'}
                )
                continue
            try:
                start = self._aware(datetime.fromisoformat(str(start_raw)))
                end = self._aware(datetime.fromisoformat(str(end_raw)))
            except ValueError:
                errors.append(
                    {index: ("Allocation slots must use valid ISO 8601 datetimes.")}
                )
                continue
            if end <= start:
                errors.append(
                    {index: "Allocation slot end time must be after start time."}
                )
                continue
            normalized.append((start, end))
        return normalized, errors

    @staticmethod
    def _overlaps(left_start, left_end, right_start, right_end):
        """Return whether two time ranges overlap."""
        return left_start < right_end and left_end > right_start

    @staticmethod
    def _expand_with_buffer(
        slot_start, slot_end, buffer_before_minutes, buffer_after_minutes
    ):
        """Expand a slot by the configured before and after buffers."""
        return (
            slot_start - timedelta(minutes=buffer_before_minutes),
            slot_end + timedelta(minutes=buffer_after_minutes),
        )

    @staticmethod
    def _minutes_by_day(slots):
        """Aggregate allocated minutes by calendar day across slot ranges."""
        minutes_by_day = {}
        for start, end in slots:
            cursor = start
            while cursor < end:
                next_midnight = datetime.combine(
                    cursor.date() + timedelta(days=1),
                    time.min,
                    tzinfo=cursor.tzinfo,
                )
                segment_end = min(end, next_midnight)
                minutes = int((segment_end - cursor).total_seconds() // 60)
                if minutes > 0:
                    minutes_by_day[cursor.date()] = (
                        minutes_by_day.get(cursor.date(), 0) + minutes
                    )
                cursor = segment_end
        return minutes_by_day

    def _validate_category_limits(self, user, categories, normalized_slots):
        """Enforce per-category daily study limits for the requested allocation."""
        if not user or not normalized_slots:
            return
        limited_categories = [
            category
            for category in categories
            if category.max_daily_study_time is not None
        ]
        if not limited_categories:
            return

        current_task_id = getattr(self.instance, "id", None)
        requested_minutes_by_day = self._minutes_by_day(normalized_slots)

        for category in limited_categories:
            existing_minutes_by_day = {}
            other_tasks = (
                Task.objects.filter(user=user, categories=category)
                .exclude(id=current_task_id)
                .exclude(allocation=[])
                .distinct()
            )
            for task in other_tasks:
                task_slots, _ = self._parse_allocation_slots(task.allocation or [])
                task_minutes_by_day = self._minutes_by_day(task_slots)
                for day, minutes in task_minutes_by_day.items():
                    existing_minutes_by_day[day] = (
                        existing_minutes_by_day.get(day, 0) + minutes
                    )

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

    def _validate_allocation_slots(
        self,
        *,
        allocation,
        allow_split,
        min_split_minutes,
        max_split_minutes,
        buffer_before_minutes,
        buffer_after_minutes,
        start_time,
        deadline,
        categories,
        estimated_minutes,
        completed_minutes,
    ):
        """Validate allocation slots against timing, buffer, and category rules."""
        if allocation in (None, []):
            return
        if not isinstance(allocation, list):
            raise serializers.ValidationError(
                {"allocation": "Allocation must be a list of time slots."}
            )

        normalized_slots, slot_errors = self._parse_allocation_slots(allocation)
        if slot_errors:
            raise serializers.ValidationError({"allocation": slot_errors})

        if len(normalized_slots) > 1 and not allow_split:
            raise serializers.ValidationError(
                {
                    "allocation": (
                        "Tasks without split enabled cannot have multiple allocations."
                    )
                }
            )

        normalized_slots.sort(key=lambda slot: slot[0])
        remaining_minutes = max(0, estimated_minutes - completed_minutes)
        allocated_minutes = 0
        for index, (slot_start, slot_end) in enumerate(normalized_slots):
            if start_time is not None and slot_start < start_time:
                raise serializers.ValidationError(
                    {
                        "allocation": (
                            "Allocation slots cannot begin before the task start time."
                        )
                    }
                )
            if deadline is not None and slot_end > deadline:
                raise serializers.ValidationError(
                    {"allocation": "Allocation slots cannot end after the deadline."}
                )

            slot_minutes = int((slot_end - slot_start).total_seconds() // 60)
            allocated_minutes += slot_minutes
            if len(normalized_slots) > 1 and slot_minutes < min_split_minutes:
                raise serializers.ValidationError(
                    {
                        "allocation": (
                            "Allocation slots cannot be shorter than the task minimum "
                            "split length."
                        )
                    }
                )
            if (
                len(normalized_slots) > 1
                and max_split_minutes is not None
                and slot_minutes > max_split_minutes
            ):
                raise serializers.ValidationError(
                    {
                        "allocation": (
                            "Allocation slots cannot be longer than the task maximum "
                            "split length."
                        )
                    }
                )

            if index > 0 and normalized_slots[index - 1][1] > slot_start:
                raise serializers.ValidationError(
                    {"allocation": "Allocation slots cannot overlap each other."}
                )

        if allocated_minutes > remaining_minutes:
            raise serializers.ValidationError(
                {
                    "allocation": (
                        "Allocation slots cannot exceed the task's remaining minutes."
                    )
                }
            )

        user = self._resolve_user()
        current_task_id = getattr(self.instance, "id", None)

        if user is not None:
            for slot_start, slot_end in normalized_slots:
                requested_blocked_start, requested_blocked_end = (
                    self._expand_with_buffer(
                        slot_start,
                        slot_end,
                        buffer_before_minutes,
                        buffer_after_minutes,
                    )
                )
                for event in Event.objects.filter(user=user):
                    event_start = self._aware(event.start_time)
                    event_end = self._aware(event.end_time)
                    if self._overlaps(
                        requested_blocked_start,
                        requested_blocked_end,
                        event_start,
                        event_end,
                    ):
                        raise serializers.ValidationError(
                            {
                                "allocation": (
                                    "Allocation slots and their task buffers cannot overlap calendar events."
                                )
                            }
                        )

                other_tasks = Task.objects.filter(user=user).exclude(id=current_task_id)
                for task in other_tasks.exclude(allocation=[]):
                    task_slots, _ = self._parse_allocation_slots(task.allocation or [])
                    for other_start, other_end in task_slots:
                        other_blocked_start, other_blocked_end = (
                            self._expand_with_buffer(
                                other_start,
                                other_end,
                                task.buffer_before_minutes,
                                task.buffer_after_minutes,
                            )
                        )
                        if self._overlaps(
                            requested_blocked_start,
                            requested_blocked_end,
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

            self._validate_category_limits(user, categories, normalized_slots)

    def _rewrite_buffer_only_conflict(self, attrs, exc):
        """Rewrite generic overlap errors when only buffer edits caused the conflict."""
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
        """Validate the calendar's data.

        Returns:
            dict: The validated data for the calendar.

        Raises:
            ValidationError: If there is invalid data.
        """
        attrs = super().validate(attrs)
        min_split_minutes = attrs.get(
            "min_split_minutes",
            getattr(self.instance, "min_split_minutes", None),
        )
        max_split_minutes = attrs.get(
            "max_split_minutes",
            getattr(self.instance, "max_split_minutes", None),
        )
        estimated_minutes = attrs.get(
            "estimated_minutes",
            getattr(self.instance, "estimated_minutes", None),
        )
        completed_minutes = attrs.get(
            "completed_minutes",
            getattr(self.instance, "completed_minutes", 0),
        )
        start_time = attrs.get("start_time", getattr(self.instance, "start_time", None))
        deadline = attrs.get("deadline", getattr(self.instance, "deadline", None))
        allow_split = attrs.get(
            "allow_split", getattr(self.instance, "allow_split", False)
        )
        buffer_before_minutes = attrs.get(
            "buffer_before_minutes",
            getattr(self.instance, "buffer_before_minutes", 0),
        )
        buffer_after_minutes = attrs.get(
            "buffer_after_minutes",
            getattr(self.instance, "buffer_after_minutes", 0),
        )
        if start_time is not None:
            start_time = self._aware(start_time)
        if deadline is not None:
            deadline = self._aware(deadline)

        if start_time and deadline and start_time > deadline:
            raise serializers.ValidationError(
                {"deadline": "Start time must be before or on the deadline."}
            )
        if (
            min_split_minutes is not None
            and max_split_minutes is not None
            and max_split_minutes < min_split_minutes
        ):
            raise serializers.ValidationError(
                {
                    "max_split_minutes": (
                        "Maximum split block minutes must be greater than or equal to minimum split block minutes."
                    )
                }
            )
        if (
            estimated_minutes is not None
            and completed_minutes is not None
            and completed_minutes > estimated_minutes
        ):
            raise serializers.ValidationError(
                {
                    "completed_minutes": (
                        "Completed minutes cannot be greater than estimated minutes."
                    )
                }
            )

        completed_requested = attrs.get("completed")
        if completed_requested is True:
            completed_minutes = estimated_minutes
            attrs["completed_minutes"] = completed_minutes
        elif completed_requested is False and "completed_minutes" not in attrs:
            completed_minutes = 0
            attrs["completed_minutes"] = completed_minutes

        attrs["completed"] = bool(
            estimated_minutes is not None
            and completed_minutes is not None
            and completed_minutes >= estimated_minutes
        )

        allocation = attrs.get("allocation", getattr(self.instance, "allocation", []))
        if attrs["completed"]:
            allocation = []
            attrs["allocation"] = []

        if "categories" in attrs:
            categories = list(attrs["categories"])
        elif self.instance is not None:
            categories = list(self.instance.categories.all())
        else:
            categories = []

        try:
            self._validate_allocation_slots(
                allocation=allocation,
                allow_split=allow_split,
                min_split_minutes=min_split_minutes or 15,
                max_split_minutes=max_split_minutes,
                buffer_before_minutes=buffer_before_minutes,
                buffer_after_minutes=buffer_after_minutes,
                start_time=start_time,
                deadline=deadline,
                categories=categories,
                estimated_minutes=estimated_minutes or 0,
                completed_minutes=completed_minutes or 0,
            )
        except serializers.ValidationError as exc:
            raise self._rewrite_buffer_only_conflict(attrs, exc)
        return attrs

    def create(self, validated_data):
        """Create a task instance.

        Args:
            validated_data (dict): The validated data for the task to be created.

        Returns:
            Task: The created task instance.
        """
        if validated_data.get("completed"):
            validated_data["allocation"] = []
        allocation = validated_data.get("allocation") or []
        validated_data["total_task_allocations"] = len(allocation)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update a Task instance with the provided data.

        Args:
            instance (Task): The Task instance to be updated.
            validated_data (dict): The validated data to enable updating the Task.

        Returns:
            Task: The updated Task instance.
        """
        if validated_data.get("completed"):
            validated_data["allocation"] = []
        allocation = validated_data.get("allocation", instance.allocation or [])
        validated_data["total_task_allocations"] = len(allocation)
        return super().update(instance, validated_data)


class CalendarResponseSerializer(serializers.ModelSerializer):
    """Serializer for the Calendar Responses."""

    categories = CategorySerializer(many=True, read_only=True)
    remaining_minutes = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "categories",
            "colour",
            "estimated_minutes",
            "completed_minutes",
            "remaining_minutes",
            "start_time",
            "deadline",
            "importance",
            "completed",
            "locked",
            "allow_split",
            "min_split_minutes",
            "max_split_minutes",
            "buffer_before_minutes",
            "buffer_after_minutes",
            "parent_task",
        ]

    def get_remaining_minutes(self, instance):
        """Calculate the remaining minutes for a task by subtracting the completed minutes and estimated minutes.

        Returns:
            int: The number of remaining minutes for the task.
        """
        return max(0, instance.estimated_minutes - instance.completed_minutes)

    def validate(self, attrs):
        """Validate the calendar's data.

        Args:
            attrs (dict): The data which is to be validated.

        Returns:
            dict: The validated data for the calendar.

        Raises:
            ValidationError: If the data is invalid.
        """
        attrs = super().validate(attrs)
        min_split_minutes = attrs.get(
            "min_split_minutes",
            getattr(self.instance, "min_split_minutes", None),
        )
        max_split_minutes = attrs.get(
            "max_split_minutes",
            getattr(self.instance, "max_split_minutes", None),
        )
        if (
            min_split_minutes is not None
            and max_split_minutes is not None
            and max_split_minutes < min_split_minutes
        ):
            raise serializers.ValidationError(
                {
                    "max_split_minutes": (
                        "Maximum split block minutes must be greater than or equal to minimum split block minutes."
                    )
                }
            )
        return attrs
