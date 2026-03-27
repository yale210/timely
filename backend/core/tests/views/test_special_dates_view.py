"""Tests for special dates view."""

from rest_framework.test import APITestCase
from rest_framework import status
from core.tests.factories import UserFactory
from core.models import SpecialDates
from django.utils import timezone


class SpecialDatesViewTests(APITestCase):
    """Test cases for special dates view."""
    def setUp(self):
        """Set up shared test fixtures."""
        self.user = UserFactory()
        self.other_user = UserFactory()
        self.client.force_authenticate(user=self.user)
        self.sd = SpecialDates.objects.create(
            user=self.user, date=timezone.localdate(), text="My Special Date"
        )
        self.other_sd = SpecialDates.objects.create(
            user=self.other_user, date=timezone.localdate(), text="Other Special Date"
        )
        self.url = "/api/special-dates/"

    def test_list_special_dates_filtered_by_user(self):
        """Test list special dates filtered by user."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see own
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["text"], "My Special Date")

    def test_create_special_date_associates_user(self):
        """Test create special date associates user."""
        data = {"date": timezone.localdate().isoformat(), "text": "New SD"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_sd = SpecialDates.objects.get(text="New SD")
        self.assertEqual(new_sd.user, self.user)
