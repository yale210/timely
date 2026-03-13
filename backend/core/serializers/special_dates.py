from rest_framework import serializers
from core.models import SpecialDates


class SpecialDatesSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = SpecialDates
        fields = ["id", "date", "text", "user"]
