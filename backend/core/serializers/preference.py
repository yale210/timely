from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from core.models import Preference


class PreferenceSerializer(serializers.ModelSerializer):
    """Serializer for the Preference model."""
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Preference
        fields = [
            "id",
            "user",
            "day_start",
            "day_end",
            "day_schedule",
            "max_hours_study_per_day",
            "max_days_ahead",
            "drag_snap_minutes",
            "limit_max_hours",
            "disable_sound_effects",
            "days_off",
            "timezone",
        ]
        read_only_fields = ["id"]

    def validate(self, attributes):
        """Validate the preference data before saving.

        Returns:
            dict: The validated attributes for the Preference instance.

        Raises:
            ValidationError: If the data does not meet model's validation criteria.
        """
        preference = self.instance or Preference()

        for attribute, value in attributes.items():
            if attribute == "days_off":
                continue  # As is a many to many field, which cannot be assigned with setattr
            setattr(preference, attribute, value)

        try:
            preference.clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        return attributes
