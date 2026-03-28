"""Tests for scheduler request serializer behavior."""

from django.test import TestCase

from scheduler.serializers import ScheduleRequestSerializer


class ScheduleRequestSerializerTests(TestCase):
    """Test validation for schedule request payloads."""

    def test_serializer_accepts_empty_payload(self):
        """Verify all schedule request fields remain optional."""
        serializer = ScheduleRequestSerializer(data={})

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data, {})

    def test_serializer_accepts_valid_payload(self):
        """Verify a complete schedule request payload validates successfully."""
        serializer = ScheduleRequestSerializer(
            data={
                "start_date": "2026-03-20",
                "max_days_ahead": 7,
                "allow_split": True,
                "replace_existing": True,
                "min_block_minutes": 30,
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["max_days_ahead"], 7)
        self.assertEqual(serializer.validated_data["min_block_minutes"], 30)
        self.assertTrue(serializer.validated_data["allow_split"])
        self.assertTrue(serializer.validated_data["replace_existing"])

    def test_serializer_rejects_invalid_bounds(self):
        """Verify schedule request bounds are enforced by the serializer."""
        serializer = ScheduleRequestSerializer(
            data={
                "max_days_ahead": 0,
                "min_block_minutes": 10,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("max_days_ahead", serializer.errors)
        self.assertIn("min_block_minutes", serializer.errors)
