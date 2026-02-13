from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from core.models import Preference
from core.serializers.preference import PreferenceSerializer


class PreferenceViewSet(viewsets.ModelViewSet):
    queryset = Preference.objects.none()
    serializer_class = PreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Preference.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if Preference.objects.filter(user=self.request.user).exists():
            raise ValidationError("This user already has a set preference.")
        serializer.save()
