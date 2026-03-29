"""Views for managing private and public profile data."""

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import GenericAPIView, RetrieveAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema

from profiles.models.profile import Profile
from profiles.serializers.profile_serializer import (
    ProfileSerializer,
    PublicProfileSerializer,
)


class ProfileAPIView(GenericAPIView):
    """Expose authenticated profile read and update operations."""

    permission_classes = [IsAuthenticated]

    serializer_class = ProfileSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def _get_profile(self, user):
        """Return the stored profile for a user, creating a default one if needed.

        Args:
            user: The authenticated Django user.

        Returns:
            Profile: The existing or newly created profile.
        """
        profile, _ = Profile.objects.get_or_create(
            user=user,
            defaults={"name": user.username},
        )
        return profile

    @extend_schema(operation_id="profiles_me_retrieve")
    def get(self, request):
        """Return the authenticated user's profile payload.

        Args:
            request: The incoming DRF request.

        Returns:
            Response: Serialized profile data.
        """
        profile = self._get_profile(request.user)
        serializer = self.serializer_class(profile)
        return Response(serializer.data)

    def patch(self, request):
        """Apply a partial update to the authenticated user's profile.

        Args:
            request: The incoming DRF request.

        Returns:
            Response: Serialized updated profile data.
        """
        profile = self._get_profile(request.user)
        serializer = self.serializer_class(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        """Replace the authenticated user's editable profile fields.

        Args:
            request: The incoming DRF request.

        Returns:
            Response: Serialized updated profile data.
        """
        profile = self._get_profile(request.user)
        serializer = self.serializer_class(profile, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class PublicProfileAPIView(RetrieveAPIView):
    """Expose public profile details for a username."""

    permission_classes = [IsAuthenticated]
    serializer_class = PublicProfileSerializer
    lookup_url_kwarg = "username"

    def get_object(self):
        """Resolve a public profile by username, creating a default profile if absent.

        Returns:
            Profile: The public profile for the requested user.
        """
        username = self.kwargs.get(self.lookup_url_kwarg)
        user = get_object_or_404(get_user_model(), username=username)
        profile, _ = Profile.objects.get_or_create(
            user=user,
            defaults={"name": user.username},
        )
        return profile
