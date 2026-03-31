"""ViewSets for managing pomodoro sessions."""

from rest_framework import permissions, viewsets

from pomo.models import PomoSession
from pomo.serializers import PomoSessionSerializer


class PomoSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for handling CRUD operations on Pomodoro sessions.

    This ViewSet allows authenticated users to retrieve and create their
    own pomodoro sessions.

    Attributes:
        serializer_class (type): The serializer class to use.
        permission_classes (list): The list of permission classes.
        http_method_names (list): Supported HTTP methods.
    """

    serializer_class = PomoSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]
    queryset = PomoSession.objects.all()

    def get_queryset(self):
        """Retrieve the queryset of pomodoro sessions for the user.

        This method filters the sessions so that the authenticated user
        only sees their own records.

        Args:
            self: The ViewSet instance.

        Returns:
            QuerySet: A filtered queryset containing the user's sessions.
        """
        return PomoSession.objects.filter(user=self.request.user)
