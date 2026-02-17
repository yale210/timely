from rest_framework import serializers

from profiles.models.preference import Preference


class PreferenceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Preference
        fields = ['user', 'sleep_start', 'sleep_end', 'days_off', 'max_tasks_per_day', 'max_schedule_ahead_days', 'timezone_offset']