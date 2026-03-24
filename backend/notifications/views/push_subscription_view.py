"""API views for managing Web Push subscriptions."""

from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from notifications.models import PushSubscription
from notifications.serializers import PushSubscriptionSerializer


class PushSubscriptionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user-specific Web Push subscriptions."""

    queryset = PushSubscription.objects.all()
    serializer_class = PushSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter subscriptions to only return those belonging to the current user.

        Returns:
            A filtered queryset of PushSubscription objects.
        """
        return PushSubscription.objects.filter(user=self.request.user)

    @action(detail=False, methods=["post"])
    def subscribe(self, request):
        """Register or update a push subscription for the current user.

        Args:
            request: The current request containing subscription details.

        Returns:
            A Response with the created/updated subscription data.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        endpoint = serializer.validated_data["endpoint"]
        # Update existing subscription or create a new one
        subscription, created = PushSubscription.objects.get_or_create(
            user=request.user,
            endpoint=endpoint,
            defaults={
                "p256dh": serializer.validated_data["p256dh"],
                "auth": serializer.validated_data["auth"],
            },
        )
        if not created:
            # Refresh keys for existing subscription
            subscription.p256dh = serializer.validated_data["p256dh"]
            subscription.auth = serializer.validated_data["auth"]
            subscription.save()

        return Response(
            PushSubscriptionSerializer(subscription).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"])
    def unsubscribe(self, request):
        """Remove a push subscription based on its endpoint.

        Args:
            request: The current request containing the endpoint to remove.

        Returns:
            A 204 No Content response or 400 if endpoint is missing.
        """
        endpoint = request.data.get("endpoint")
        if not endpoint:
            return Response(
                {"error": "Endpoint is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Targeted deletion of the specific subscription endpoint
        PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def vapid_public_key(self, request):
        """Retrieve the server's VAPID public key.

        Args:
            request: The current request.

        Returns:
            A JSON response containing the public key.
        """
        vapid_public_key = settings.VAPID_PUBLIC_KEY
        if not vapid_public_key:
            return Response(
                {"error": "VAPID public key is not configured on the server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({"public_key": vapid_public_key})
