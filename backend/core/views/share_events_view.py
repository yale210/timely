from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from core.models import PendingShareEvent
from django.db.models import Q


class ShareEventsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):

        shared_events = PendingShareEvent.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user)
        )

        response = [
            {
                "id": s.id,
                "sender": s.sender.id,
                "receiver": s.receiver.id,
                "sender_username": s.sender.username,
                "receiver_username": s.receiver.username,
                "event_id": s.event.id,
                "event_title": s.event.title,
            }
            for s in shared_events
        ]

        return Response(response)
