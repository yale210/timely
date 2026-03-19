from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import serializers
from core.models import Friendship
from core.serializers.friendship import FriendshipSerializer
from profiles.models.profile import Profile
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory

User = get_user_model()


class FriendshipSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="sender", email="sender@example.com"
        )
        self.receiver = User.objects.create_user(
            username="receiver", email="receiver@example.com"
        )
        self.friendship = Friendship.objects.create(
            sender=self.user, receiver=self.receiver
        )
        # Profile might be auto-created, but ensure it exists
        self.sender_profile, _ = Profile.objects.get_or_create(
            user=self.user, defaults={"name": "Sender"}
        )
        self.receiver_profile, _ = Profile.objects.get_or_create(
            user=self.receiver, defaults={"name": ""}
        )

    def test_validate_both_provided(self):
        serializer = FriendshipSerializer(
            data={"receiver": self.receiver.id, "receiver_username": "receiver"}
        )
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.is_valid(raise_exception=True)
        self.assertIn("receiver_username", cm.exception.detail)

    def test_validate_username_exists(self):
        serializer = FriendshipSerializer(data={"receiver_username": "receiver"})
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["receiver"], self.receiver)

    def test_validate_username_does_not_exist(self):
        serializer = FriendshipSerializer(data={"receiver_username": "nonexistent"})
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.is_valid(raise_exception=True)
        self.assertIn("receiver_username", cm.exception.detail)

    def test_validate_no_receiver(self):
        serializer = FriendshipSerializer(data={})
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.is_valid(raise_exception=True)
        self.assertIn("receiver_username", cm.exception.detail)

    def test_get_profile_name_exists(self):
        serializer = FriendshipSerializer()
        self.assertEqual(serializer._get_profile_name(self.user), "Sender")

    def test_get_profile_name_fallback(self):
        # receiver_profile has empty name
        self.receiver_profile.name = ""
        self.receiver_profile.save()
        serializer = FriendshipSerializer()
        self.assertEqual(serializer._get_profile_name(self.receiver), "receiver")

    def test_get_profile_no_profile(self):
        # User without profile (should fallback to username)
        user_no_profile = User.objects.create_user(
            username="noprofile", email="no@profile.com"
        )
        # Ensure profile doesn't exist
        Profile.objects.filter(user=user_no_profile).delete()
        serializer = FriendshipSerializer()
        self.assertEqual(serializer._get_profile_name(user_no_profile), "noprofile")

    def test_get_avatar_url_none(self):
        serializer = FriendshipSerializer()
        self.assertIsNone(serializer._get_avatar_url(self.user))

    def test_get_avatar_url_with_request(self):
        avatar = SimpleUploadedFile(
            "avatar.png", b"file_content", content_type="image/png"
        )
        self.sender_profile.avatar = avatar
        self.sender_profile.save()

        factory = APIRequestFactory()
        request = factory.get("/")
        serializer = FriendshipSerializer(context={"request": request})
        avatar_url = serializer._get_avatar_url(self.user)
        self.assertIn("http://testserver", avatar_url)

    def test_get_avatar_url_without_request(self):
        avatar = SimpleUploadedFile(
            "avatar2.png", b"file_content", content_type="image/png"
        )
        self.sender_profile.avatar = avatar
        self.sender_profile.save()

        serializer = FriendshipSerializer()
        avatar_url = serializer._get_avatar_url(self.user)
        self.assertTrue(avatar_url.startswith("/api/media/avatars/avatar2"))

    def test_get_sender_name(self):
        serializer = FriendshipSerializer()
        self.assertEqual(serializer.get_sender_name(self.friendship), "Sender")

    def test_get_receiver_name(self):
        # Set receiver profile name
        self.receiver_profile.name = "Receiver"
        self.receiver_profile.save()
        serializer = FriendshipSerializer()
        self.assertEqual(serializer.get_receiver_name(self.friendship), "Receiver")

    def test_get_sender_avatar(self):
        serializer = FriendshipSerializer()
        self.assertIsNone(serializer.get_sender_avatar(self.friendship))

    def test_get_receiver_avatar(self):
        serializer = FriendshipSerializer()
        self.assertIsNone(serializer.get_receiver_avatar(self.friendship))
