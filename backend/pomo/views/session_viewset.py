from rest_framework import viewsets, permissions
from pomo.models import PomoSession
from pomo.serializers import PomoSessionSerializer

class PomoSessionViewSet(viewsets.ModelViewSet):
    serializer_class = PomoSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PomoSession.objects.filter(user=self.request.user)
