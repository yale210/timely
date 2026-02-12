from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers
from core.models import Event, EventReminder
from core.models import Category


class EventReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventReminder
        fields = ["id", "type", "minutes_before"]


MAX_REMINDERS_PER_EVENT = 5


class EventSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    reminders = EventReminderSerializer(many=True, required=False)
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
            "categories",
            "start_time",
            "end_time",
            "recurrence_interval",
            "recurrence_end",
            "reminders",
        ]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Use CategorySerializer for full objects in responses
        from core.serializers.category_serializer import CategorySerializer

        representation["categories"] = CategorySerializer(
            instance.categories.all(), many=True
        ).data
        return representation

    def validate(self, attributes):
        # Validate max reminders
        reminders_data = attributes.get("reminders", [])
        if len(reminders_data) > MAX_REMINDERS_PER_EVENT:
            raise serializers.ValidationError(
                {
                    "reminders": f"Maximum of {MAX_REMINDERS_PER_EVENT} reminders allowed per event."
                }
            )

        # Create a temporary instance to run clean()
        attrs_copy = attributes.copy()
        # Pop M2M and custom fields
        reminders_data = attrs_copy.pop("reminders", None)
        attrs_copy.pop("categories", None)

        event = self.instance or Event()
        for attribute, value in attrs_copy.items():
            setattr(event, attribute, value)

        try:
            event.clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        return attributes

    @transaction.atomic
    def create(self, validated_data):
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
