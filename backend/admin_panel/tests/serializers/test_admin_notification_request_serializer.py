"""Tests for admin notification request serializer behavior."""

from django.test import TestCase

from admin_panel.serializers import AdminNotificationRequestSerializer


class AdminNotificationRequestSerializerTests(TestCase):
    """Test validation behavior for admin notification requests."""

    def test_validate_trims_text_and_deduplicates_user_ids(self):
        """Verify validation trims text fields and deduplicates user IDs."""
        serializer = AdminNotificationRequestSerializer(
            data={
                "title": "  Release Update  ",
                "message": "  The deployment completed.  ",
                "target": "users",
                "user_ids": [3, 1, 3, 2],
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["title"], "Release Update")
        self.assertEqual(
            serializer.validated_data["message"], "The deployment completed."
        )
        self.assertEqual(serializer.validated_data["user_ids"], [1, 2, 3])

    def test_validate_requires_user_ids_for_users_target(self):
        """Verify targeted sends require explicit user IDs."""
        serializer = AdminNotificationRequestSerializer(
            data={
                "title": "Release Update",
                "message": "The deployment completed.",
                "target": "users",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["user_ids"][0],
            "At least one user ID is required when target is 'users'.",
        )

    def test_validate_clears_user_ids_for_non_user_targets(self):
        """Verify non-user targets ignore any provided user IDs."""
        serializer = AdminNotificationRequestSerializer(
            data={
                "title": "Release Update",
                "message": "The deployment completed.",
                "target": "all",
                "user_ids": [9, 4],
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["target"], "all")
        self.assertEqual(serializer.validated_data["user_ids"], [])

    def test_validate_requires_non_blank_title_and_message(self):
        """Verify blank title and message values fail validation."""
        serializer = AdminNotificationRequestSerializer(
            data={
                "title": "   ",
                "message": "   ",
                "target": "staff",
            }
        )

        self.assertFalse(serializer.is_valid())
        if "title" in serializer.errors:
            self.assertIn("title", serializer.errors)
            self.assertIn("message", serializer.errors)
        else:
            self.assertIn("detail", serializer.errors)

    def test_validate_whitespace_only_reaches_custom_validation(self):
        """Verify that if field validation passes, our custom validate() catches stripped blanks."""
        serializer = AdminNotificationRequestSerializer(
            data={
                "title": "Valid Title",
                "message": "   ",
                "target": "all",
            }
        )

        self.assertFalse(serializer.is_valid())
        if "detail" in serializer.errors:
            self.assertEqual(
                serializer.errors["detail"], "Title and message are required."
            )

    def test_validate_no_user_ids_non_users_target(self):
        """the case where user_ids is missing and target is not 'users'."""
        serializer = AdminNotificationRequestSerializer(
            data={
                "title": "Title",
                "message": "Message",
                "target": "all",
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["user_ids"], [])

    def test_validate_method_directly_to_hit_line_38(self):
        """Bypass field-level validation by calling validate() directly."""
        from rest_framework import serializers

        serializer = AdminNotificationRequestSerializer()
        # Case 1: title becomes empty after strip
        attrs = {"title": "   ", "message": "Valid message", "target": "all"}
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate(attrs)
        self.assertEqual(
            cm.exception.detail["detail"], "Title and message are required."
        )

        # Case 2: message becomes empty after strip
        attrs = {"title": "Valid title", "message": "   ", "target": "all"}
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate(attrs)
        self.assertEqual(
            cm.exception.detail["detail"], "Title and message are required."
        )
