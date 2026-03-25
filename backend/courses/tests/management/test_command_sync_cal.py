from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase


class SyncCalCommandTests(TestCase):
    def setUp(self):
        self.User = get_user_model()
        self.user = self.User.objects.create_user(
            username="student",
            password="password123",
            email="student@example.com",
        )
        self.other_user = self.User.objects.create_user(
            username="other",
            password="password123",
            email="other@example.com",
        )

    @patch(
        "courses.management.commands.sync_cal.CourseEventSyncService.sync_user_course_events"
    )
    def test_sync_cal_command_syncs_specific_user(self, mock_sync):
        mock_sync.return_value = {"created": 2, "updated": 1, "errors": []}
        out = StringIO()

        call_command("sync_cal", user=self.user.username, stdout=out)

        mock_sync.assert_called_once_with(self.user)
        self.assertIn(f"✅ Synced for {self.user.username}", out.getvalue())
        self.assertIn("Created=2", out.getvalue())
        self.assertIn("Updated=1", out.getvalue())

    @patch(
        "courses.management.commands.sync_cal.CourseEventSyncService.sync_user_course_events"
    )
    def test_sync_cal_command_syncs_all_users_when_no_user_is_provided(self, mock_sync):
        mock_sync.side_effect = [
            {"created": 1, "updated": 0, "errors": []},
            {"created": 3, "updated": 2, "errors": []},
        ]
        out = StringIO()

        call_command("sync_cal", stdout=out)

        self.assertEqual(mock_sync.call_count, 2)
        self.assertEqual(
            [call.args[0] for call in mock_sync.call_args_list],
            [self.user, self.other_user],
        )
        self.assertIn("✅ Synced all users", out.getvalue())
        self.assertIn("Created=4", out.getvalue())
        self.assertIn("Updated=2", out.getvalue())
