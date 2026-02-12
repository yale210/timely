from rest_framework import viewsets, permissions
from drf_spectacular.utils import extend_schema, extend_schema_view
from core.models import Event
from core.serializers.event import EventSerializer, EventResponseSerializer


@extend_schema_view(
    list=extend_schema(responses=EventResponseSerializer(many=True)),
    retrieve=extend_schema(responses=EventResponseSerializer),
    create=extend_schema(request=EventSerializer, responses=EventResponseSerializer),
    update=extend_schema(request=EventSerializer, responses=EventResponseSerializer),
    partial_update=extend_schema(
        request=EventSerializer,
        responses=EventResponseSerializer,
    ),
)
class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(user=self.request.user).order_by("id")
