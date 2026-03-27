"""Serializers and validation helpers for event resources."""

from datetime import timedelta

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from core.models import Category, Event, EventReminder
from core.serializers.category_serializer import CategorySerializer


class EventReminderSerializer(serializers.ModelSerializer):
    """Serializer for the EventReminder model."""

    class Meta:
        model = EventReminder
        fields = ["id", "send_push", "send_email", "minutes_before"]


class ExpandedEventReminderSerializer(serializers.Serializer):
    """Serializer for event reminders with expanded fields."""

    id = serializers.IntegerField(required=False)
    send_push = serializers.BooleanField(required=False, default=False)
    send_email = serializers.BooleanField(required=False, default=False)
    minutes_before = serializers.IntegerField(min_value=0)


MAX_REMINDERS_PER_EVENT = 5


class EventSerializer(serializers.ModelSerializer):
    """Serializer for the Event model."""

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    reminders = EventReminderSerializer(many=True, required=False)
    split_from_event_id = serializers.IntegerField(read_only=True)
    categories = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Category.objects.all(), required=False
    )

    class Meta:
        model = Event
        fields = [
            "id",
            "user",
            "title",
            "description",
            "location",
            "colour",
            "categories",
            "start_time",
            "end_time",
            "recurrence_interval",
            "recurrence_end",
            "split_from_event_id",
            "reminders",
        ]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        """Return serialized representation of the event with nested category details.

        Returns:
            dict: The event data with nested category details.
        """
        representation = super().to_representation(instance)
        representation["categories"] = CategorySerializer(
            instance.categories.all(), many=True
        ).data
        return representation

    def __init__(self, *args, **kwargs):
        """Initialise the serializer."""
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            self.fields["categories"].queryset = Category.objects.filter(
                user=request.user
            )
        else:
            self.fields["categories"].queryset = Category.objects.none()

    def validate(self, attributes):
        """Validate the event data.

        Args:
            attributes (dict): The data to be validated.

        Returns:
            dict: The validated data.
        """
        reminders_data = attributes.get("reminders", [])

        self._validate_reminders(reminders_data, attributes)

        event = self._build_event_for_validation(attributes)

        self._clean_event(event)
        return attributes

    def _validate_reminders(self, reminders_data, attributes):
        """Validate reminder count and trigger times for the incoming payload."""
        # Validate max reminders
        self._validate_max_reminders(reminders_data)

        # Validate that no reminder would trigger in the past
        start_time = attributes.get(
            "start_time",
            self.instance.start_time if self.instance else None,
        )
        if start_time and reminders_data:
            for reminder in reminders_data:
                minutes_before = reminder.get("minutes_before", 0)
                trigger_at = start_time - timedelta(minutes=minutes_before)
                self._validate_trigger_time(trigger_at, minutes_before)

    def _build_event_for_validation(self, attributes):
        """Build a temporary event instance so model validation can run safely."""
        attrs_copy = attributes.copy()
        attrs_copy.pop("reminders", None)
        attrs_copy.pop("categories", None)

        if self.instance is None:
            event = Event()
            for attribute, value in attrs_copy.items():
                setattr(event, attribute, value)
        else:
            # Build a temporary model snapshot so validation never mutates the
            # live instance state before scoped recurrence logic runs.
            base_values: dict[str, object] = {
                field.name: getattr(self.instance, field.name)
                for field in Event._meta.fields
                if not field.primary_key
            }
            base_values.update(attrs_copy)
            event = Event(**base_values)
            event.pk = self.instance.pk
        return event

    @transaction.atomic
    def create(self, validated_data):
        """Create an Event instance and it's reminders.

        Args:
            validated_data (dict): The validated data for the Event and its reminders.

        Returns:
            Event: The created instance.
        """
        reminders_data = validated_data.pop("reminders", [])
        categories_data = validated_data.pop("categories", [])
        event = Event.objects.create(**validated_data)
        if categories_data:
            event.categories.set(categories_data)
        for reminder_data in reminders_data:
            EventReminder.objects.create(event=event, **reminder_data)
        return event

    @transaction.atomic
    def update(self, instance, validated_data):
        """Update an Event instance and its reminders.

        Args:
            instance (Event): The Event instance to be updated.
            validated_data (dict): The validated data.

        Returns:
            Event: The updated Event instance.
        """
        reminders_data = validated_data.pop("reminders", None)
        categories_data = validated_data.pop("categories", None)

        # Update event fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if categories_data is not None:
            instance.categories.set(categories_data)

        if reminders_data is not None:
            instance.reminders.all().delete()
            for reminder_data in reminders_data:
                EventReminder.objects.create(event=instance, **reminder_data)

        return instance

    def _validate_max_reminders(self, reminders_data):
        """Enforce the maximum number of reminders allowed per event."""
        if len(reminders_data) > MAX_REMINDERS_PER_EVENT:
            raise serializers.ValidationError(
                {
                    "reminders": f"Maximum of {MAX_REMINDERS_PER_EVENT} reminders allowed per event."
                }
            )

    def _validate_trigger_time(self, trigger_at, minutes_before):
        """Reject reminders that would fire in the past."""
        now = timezone.now()
        if trigger_at <= now:
            raise serializers.ValidationError(
                {
                    "reminders": f"Reminder set to {minutes_before} minutes before would trigger in the past."
                }
            )

    def _clean_event(self, event):
        """Run model validation and translate Django errors into DRF errors."""
        try:
            event.clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)


class EventResponseSerializer(serializers.ModelSerializer):
    """Serializer for the Event model used in responses."""

    categories = CategorySerializer(many=True, read_only=True)
    reminders = EventReminderSerializer(many=True, read_only=True)
    split_from_event_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "description",
            "location",
            "colour",
            "categories",
            "start_time",
            "end_time",
            "recurrence_interval",
            "recurrence_end",
            "split_from_event_id",
            "reminders",
        ]


class ExpandedEventInstanceSerializer(serializers.Serializer):
    """Serializer for event instances."""

    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    location = serializers.CharField(allow_blank=True)
    colour = serializers.CharField(allow_null=True, required=False)
    categories = CategorySerializer(many=True)
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    recurrence_interval = serializers.CharField(
        allow_blank=True,
        allow_null=True,
        required=False,
    )
    recurrence_end = serializers.DateField(allow_null=True, required=False)
    reminders = ExpandedEventReminderSerializer(many=True)
    is_override = serializers.BooleanField()
    source_event_id = serializers.IntegerField()
    original_start_time = serializers.DateTimeField(allow_null=True, required=False)
    instance_id = serializers.CharField()
    is_split_series = serializers.BooleanField()
    split_from_event_id = serializers.IntegerField(allow_null=True, required=False)
