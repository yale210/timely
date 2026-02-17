from django.test import TestCase
from django.contrib.auth import get_user_model
from core.serializers.preference import PreferenceSerializer
from core.models import Preference
import datetime

User = get_user_model()


class PreferenceSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="password", email="test@example.com"
        )

    def test_validation_error_from_model(self):
        # Model has a clean() method that raises ValidationError if sleep_start == sleep_end
        data = {"sleep_start": "08:00:00", "sleep_end": "08:00:00"}
        serializer = PreferenceSerializer(
            data=data, context={"request": type("obj", (object,), {"user": self.user})}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("sleep_end", serializer.errors)

    def test_update_preference(self):
        pref = Preference.objects.create(
            user=self.user,
            sleep_start=datetime.time(22, 0),
            sleep_end=datetime.time(6, 0),
        )
        data = {"sleep_start": "23:00:00"}
        serializer = PreferenceSerializer(
            instance=pref,
            data=data,
            partial=True,
            context={"request": type("obj", (object,), {"user": self.user})},
        )
        self.assertTrue(serializer.is_valid())
        serializer.save()
        pref.refresh_from_db()
        self.assertEqual(pref.sleep_start, datetime.time(23, 0))
