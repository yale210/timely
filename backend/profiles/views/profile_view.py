from rest_framework.authentication import TokenAuthentication
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from profiles.models.profile import Profile
from profiles.serializers.profile_serializer import ProfileSerializer


class ProfileAPIView(GenericAPIView):


    permission_classes = [IsAuthenticated]

    serializer_class = ProfileSerializer

    def get(self, request):
        user = request.user
        profile = Profile.objects.get_or_create(user=user)
        serializer = self.serializer_class(profile)
        return Response(serializer.data)