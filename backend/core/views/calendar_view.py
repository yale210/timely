from rest_framework import viewsets, permissions
from core.models import Task
from core.serializers import CalendarSerializer

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).order_by('start_time')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)