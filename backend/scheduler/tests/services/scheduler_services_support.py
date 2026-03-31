"""Shared support for scheduler service tests."""

from datetime import datetime, time

from django.contrib.auth import get_user_model
from django.utils import timezone

from core.models import Preference


class SchedulerServicesSupport:
    """Shared fixtures for scheduler service tests."""

    def setUp(self):
        super().setUp()
        User = get_user_model()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password",
        )
        self.reference_dt = timezone.make_aware(datetime(2026, 2, 12, 9, 0))
        self.preference = Preference.objects.create(
            user=self.user,
            day_start=time(7, 0),
            day_end=time(23, 0),
        )
