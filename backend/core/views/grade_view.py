from rest_framework import viewsets, permissions
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model

from core.models import Grade
from core.serializers import GradeSerializer


class GradeViewSet(viewsets.ModelViewSet):
    serializer_class = GradeSerializer
    ##COME BACK TO THIS - MAY NEED TO CHANGE PERMISSIONS
    authentication_classes = []
    permission_classes = [AllowAny]

    @property
    def dev_user(self):
        """Return authenticated user or first user as fallback for dev tests."""
        user = getattr(self.request, "user", None)
        if getattr(user, "is_authenticated", False):
            return user
        return get_user_model().objects.first()

    def get_queryset(self):
        return Grade.objects.filter(user=self.dev_user).order_by("-date_achieved")

    def perform_create(self, serializer):
        serializer.save(user=self.dev_user)
