import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase

from core.models import Profile


class ProfileTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser",
            password="password123",
            email="test@user.com"
        )
        self.profile = Profile.objects.create(
            user=self.user, date_of_birth=datetime.date(2006, 4, 20)
        )

    def test_profile_str(self):
        self.assertEqual(str(self.profile), str(self.user))

    def test_valid_profile(self):
        self.profile.full_clean()

    def test_profile_can_have_a_date_of_birth(self):
        dob = datetime.date(2006, 2, 24)
        self.profile.date_of_birth = dob

        self.assertEqual(self.profile.date_of_birth, dob)

    def test_profile_can_have_null_date_of_birth(self):
        self.profile.date_of_birth = None

        self.assertIsNone(self.profile.date_of_birth)
