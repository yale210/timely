from rest_framework.generics import GenericAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from django.db.models import Q

from profiles.models.profile import Profile
from profiles.serializers.profile_serializer import (
    ProfileSerializer,
)


from core.models import Friendship


class LeaderboardAPIView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    serializer_class = ProfileSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def getProfile(self, user):
        profile, _ = Profile.objects.get_or_create(
            user=user,
            defaults={"name": user.username},
        )
        return profile
    
    def get(self, request):
        target_profile = self.getProfile(request.user)

        target_profile_friendship_entries= Friendship.objects.filter(Q(sender=target_profile.user) | Q(receiver=target_profile.user), state=Friendship.State.ACCEPTED)

        friends_ids = []
        friends_ids.append(request.user)

        for entries in target_profile_friendship_entries:
            if entries.sender == target_profile.user:
                friends_ids.append(entries.receiver)
            else:
                friends_ids.append(entries.sender)

        friends_profiles = Profile.objects.filter(user__in=friends_ids).order_by("-level")
        serializer = self.serializer_class(friends_profiles, many=True)
        return Response(serializer.data)




        

