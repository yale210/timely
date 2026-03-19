from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class ProfileAPIViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="password",
            email="test@example.com",
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse("profile")

    def test_get_profile(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], self.user.username)

    def test_patch_profile(self):
        response = self.client.patch(self.url, {"slogan": "New Slogan"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["slogan"], "New Slogan")

    def test_put_profile(self):
        response = self.client.put(self.url, {"name": "New Name"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "New Name")


class PublicProfileAPIViewTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser",
            password="password",
            email="test@example.com",
        )
        self.other_user = get_user_model().objects.create_user(
            username="other",
            password="password",
            email="other@example.com",
        )
        self.client.force_authenticate(user=self.user)

    def test_get_public_profile(self):
        url = reverse("public-profile", kwargs={"username": "other"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "other")

    def test_get_public_profile_not_found(self):
        url = reverse("public-profile", kwargs={"username": "nonexistent"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
