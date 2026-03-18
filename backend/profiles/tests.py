import datetime

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
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

    def test_patch_rejects_future_date_of_birth(self):
        tomorrow = timezone.now().date() + datetime.timedelta(days=1)

        response = self.client.patch(
            self.url,
            {"date_of_birth": tomorrow.isoformat()},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {"date_of_birth": ["Date of birth cannot be in the future."]},
        )
