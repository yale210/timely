from rest_framework import serializers

from profiles.models.profile import Profile


class ProfileSerializer(serializers.ModelSerializer):

    class  Meta:
        model = Profile
        fields = ['name', 'date_of_birth', 'creation_date', 'slogan', 'bio']