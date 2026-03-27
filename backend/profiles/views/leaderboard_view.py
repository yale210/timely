"""Views for profile leaderboard endpoints."""

from django.db.models import Q
from rest_framework.generics import GenericAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Friendship
from profiles.models.profile import Profile
from profiles.serializers.profile_serializer import ProfileSerializer


class LeaderboardAPIView(GenericAPIView):
    """Return leaderboard data for the authenticated user and their friends."""

    permission_classes = [IsAuthenticated]

    serializer_class = ProfileSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_profile(self, user):
        """Return a profile for a user, creating a default one if needed.

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

    def get(self, request):
        """Return leaderboard entries for the current user and accepted friends.

        Args:
            request: The incoming DRF request.

        Returns:
            Response: Serialized leaderboard profiles ordered by level.
        """
        target_profile = self.get_profile(request.user)

        target_profile_friendship_entries = Friendship.objects.filter(
            Q(sender=target_profile.user) | Q(receiver=target_profile.user),
            state=Friendship.State.ACCEPTED,
        )

        friends_ids = []
        friends_ids.append(request.user)

        for entries in target_profile_friendship_entries:
            if entries.sender == target_profile.user:
                friends_ids.append(entries.receiver)
            else:
                friends_ids.append(entries.sender)

        friends_profiles = Profile.objects.filter(user__in=friends_ids).order_by(
            "-level", "-xp", "name"
        )
        serializer = self.serializer_class(friends_profiles, many=True)
        return Response(serializer.data)
