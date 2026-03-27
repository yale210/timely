"""Tests for pomo serializers."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from pomo.models import PomoSession
from pomo.serializers import PomoSessionSerializer
from pomo.views.session_viewset import PomoSessionViewSet


class PomoSerializerTests(TestCase):
    """Test cases for pomo serializer behavior."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.user = get_user_model().objects.create_user(
            username="pomo-user",
            email="pomo@example.com",
            password="password123",
        )
        self.request_factory = APIRequestFactory()

    def test_serializer_create_sets_user_completed_time_and_model_string(self):
        """Test serializer create sets user and completion metadata correctly."""
        request = self.request_factory.post("/api/pomo/sessions/")
        request.user = self.user

        serializer = PomoSessionSerializer(
            data={"duration_minutes": 25},
            context={"request": request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

        session = serializer.save()

        self.assertEqual(session.user, self.user)
        self.assertIsNotNone(session.completed_at)
        self.assertIn(self.user.username, str(session))
        self.assertIn("25 mins", str(session))

    def test_viewset_queryset_is_scoped_to_authenticated_user(self):
        """Test the viewset queryset only returns sessions for the request user."""
        other_user = get_user_model().objects.create_user(
            username="other-pomo-user",
            email="other-pomo@example.com",
            password="password123",
        )
        owned = PomoSession.objects.create(
            user=self.user,
            duration_minutes=30,
            completed_at=timezone.now(),
        )
        PomoSession.objects.create(
            user=other_user,
            duration_minutes=15,
            completed_at=timezone.now(),
        )
        request = self.request_factory.get("/api/pomo/sessions/")
        request.user = self.user

        view = PomoSessionViewSet()
        view.request = request

        self.assertEqual(list(view.get_queryset()), [owned])
