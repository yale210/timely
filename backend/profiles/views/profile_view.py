from rest_framework.generics import GenericAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from profiles.models.profile import Profile
from profiles.serializers.profile_serializer import (
    ProfileSerializer,
    PublicProfileSerializer,
)


class ProfileAPIView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    serializer_class = ProfileSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def _get_profile(self, user):
        profile, _ = Profile.objects.get_or_create(
            user=user,
            defaults={"name": user.username},
        )
        return profile

    def get(self, request):
        profile = self._get_profile(request.user)
        serializer = self.serializer_class(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile = self._get_profile(request.user)
        serializer = self.serializer_class(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        profile = self._get_profile(request.user)
        serializer = self.serializer_class(profile, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class PublicProfileAPIView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PublicProfileSerializer
    lookup_url_kwarg = "username"

    def get_object(self):
        username = self.kwargs.get(self.lookup_url_kwarg)
        user = get_object_or_404(get_user_model(), username=username)
        profile, _ = Profile.objects.get_or_create(
            user=user,
            defaults={"name": user.username},
        )
        return profile
