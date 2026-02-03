from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers
from core.models import Event, EventReminder


class EventReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventReminder
        fields = ["id", "type", "minutes_before"]


class EventSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    reminders = EventReminderSerializer(many=True, required=False)

    class Meta:
        model = EventReminder
        model = Event
        fields = [
            "id",
            "user",
            "title",
            "description",
            "location",
            "event_category",
            "importance",
            "start_time",
            "end_time",
            "recurrence_interval",
            "recurrence_end",
            "reminders",
        ]
        read_only_fields = ["id"]

    def validate(self, attributes):
        # Create a temporary instance to run clean()
        # We exclude 'reminders' from attributes because it's not a model field
        attrs_copy = attributes.copy()
        reminders_data = attrs_copy.pop('reminders', None)
        
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
        event = Event.objects.create(**validated_data)
        for reminder_data in reminders_data:
            EventReminder.objects.create(event=event, **reminder_data)
        return event

    @transaction.atomic
    def update(self, instance, validated_data):
        reminders_data = validated_data.pop("reminders", None)
        
        # Update event fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if reminders_data is not None:
            # Simple approach: delete existing reminders and recreate
            instance.reminders.all().delete()
            for reminder_data in reminders_data:
                EventReminder.objects.create(event=instance, **reminder_data)
        
        return instance
