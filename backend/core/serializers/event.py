from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from core.models import Event


class EventSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Event
        fields = [
            "id",
            "user",
            "event_category",
            "importance",
            "time",
            "date",
            "recurring",
            "recurring_start",
            "recurring_end",
            "recurring_interval",
        ]
        read_only_fields = ["id"]

    def validate(self, attributes):
        event = self.instance or Event()

        for attribute, value in attributes.items():
            setattr(event, attribute, value)

        try:
            event.clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        return attributes
