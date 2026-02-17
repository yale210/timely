from rest_framework import permissions
from rest_framework.viewsets import ModelViewSet

from profiles.models.preference import Preference
from serializers.preference import PreferenceSerializer


class PreferenceViewSet(ModelViewSet):

    queryset = Preference.objects.all()
    serializer_class = PreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
