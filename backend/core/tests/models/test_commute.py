import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase

from core.models import Commute


class CommuteTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser",
            password="password123",
        )

    def test_commute_can_be_created(self):
        commute = Commute.objects.create(
            user=self.user,
            commute_start=datetime.time(8, 0),
            commute_end=datetime.time(9, 0),
        )

        self.assertEqual(commute.user, self.user)

    def test_commute_str(self):
        commute = Commute.objects.create(
            user=self.user,
            commute_start=datetime.time(8, 0),
            commute_end=datetime.time(9, 0),
        )

        self.assertEqual(str(commute), "08:00:00 - 09:00:00")

    def test_user_can_have_multiple_commutes(self):
        Commute.objects.create(
            user=self.user,
            commute_start=datetime.time(8, 0),
            commute_end=datetime.time(9, 0),
        )
        Commute.objects.create(
            user=self.user,
            commute_start=datetime.time(18, 0),
            commute_end=datetime.time(19, 0),
        )

        self.assertEqual(self.user.commute.count(), 2)
