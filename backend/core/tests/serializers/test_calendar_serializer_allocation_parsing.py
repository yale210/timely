"""Tests for calendar allocation validation behaviour."""

import datetime

from django.utils import timezone
from django.utils.timezone import make_aware
from rest_framework import serializers

from core.serializers import CalendarSerializer

from .calendar_serializer_test_support import CalendarSerializerTestSupport


class CalendarSerializerAllocationParsingTests(CalendarSerializerTestSupport):
    """Test cases for calendar serializer allocation parsing."""
    def test_parse_allocation_slots_collects_errors_and_normalizes_valid_datetimes(
        self,
    ):
        """Test parse allocation slots collects errors and normalizes valid datetimes."""
        serializer = CalendarSerializer(context=self._request_context())

        normalized, errors = serializer._parse_allocation_slots(
            [
                "not-a-dict",
                {},
                {"start": "not-iso", "end": "still-not-iso"},
                {
                    "start": "2026-03-20T10:00:00",
                    "end": "2026-03-20T09:00:00",
                },
                {
                    "start": "2026-03-20T10:00:00",
                    "end": "2026-03-20T11:00:00",
                },
            ]
        )

        self.assertEqual(len(errors), 4)
        self.assertEqual(len(normalized), 1)
        self.assertTrue(timezone.is_aware(normalized[0][0]))

    def test_minutes_by_day_splits_cross_midnight(self):
        """Test minutes by day splits cross midnight."""
        serializer = CalendarSerializer(context=self._request_context())
        start = make_aware(datetime.datetime(2026, 3, 20, 23, 30))
        end = make_aware(datetime.datetime(2026, 3, 21, 0, 30))

        minutes_by_day = serializer._minutes_by_day([(start, end)])

        self.assertEqual(minutes_by_day[start.date()], 30)
        self.assertEqual(minutes_by_day[end.date()], 30)

    def test_validate_allocation_slots_rejects_non_list(self):
        """Test validate allocation slots rejects non list."""
        serializer = CalendarSerializer(context=self._request_context())

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation="invalid",
                allow_split=False,
                min_split_minutes=15,
                max_split_minutes=None,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=None,
                deadline=None,
                categories=[],
                estimated_minutes=60,
                completed_minutes=0,
            )

    def test_validate_allocation_slots_rejects_multiple_slots_without_split(self):
        """Test validate allocation slots rejects multiple slots without split."""
        serializer = CalendarSerializer(context=self._request_context())
        now = timezone.now() + datetime.timedelta(days=1)

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": now.isoformat(),
                        "end": (now + datetime.timedelta(minutes=30)).isoformat(),
                    },
                    {
                        "start": (now + datetime.timedelta(minutes=30)).isoformat(),
                        "end": (now + datetime.timedelta(minutes=60)).isoformat(),
                    },
                ],
                allow_split=False,
                min_split_minutes=15,
                max_split_minutes=None,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=2),
                categories=[],
                estimated_minutes=60,
                completed_minutes=0,
            )

    def test_validate_allocation_slots_rejects_start_deadline_and_remaining_limit_errors(
        self,
    ):
        """Test validate allocation slots rejects start deadline and remaining limit errors."""
        serializer = CalendarSerializer(context=self._request_context())
        now = timezone.now() + datetime.timedelta(days=1)

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": (now - datetime.timedelta(minutes=30)).isoformat(),
                        "end": now.isoformat(),
                    }
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=None,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=2),
                categories=[],
                estimated_minutes=60,
                completed_minutes=0,
            )

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": now.isoformat(),
                        "end": (now + datetime.timedelta(hours=3)).isoformat(),
                    }
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=None,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=2),
                categories=[],
                estimated_minutes=60,
                completed_minutes=0,
            )

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": now.isoformat(),
                        "end": (now + datetime.timedelta(hours=2)).isoformat(),
                    }
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=None,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=3),
                categories=[],
                estimated_minutes=30,
                completed_minutes=0,
            )

    def test_validate_allocation_slots_rejects_min_max_and_overlap_errors(self):
        """Test validate allocation slots rejects min max and overlap errors."""
        serializer = CalendarSerializer(context=self._request_context())
        now = timezone.now() + datetime.timedelta(days=1)

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": now.isoformat(),
                        "end": (now + datetime.timedelta(minutes=10)).isoformat(),
                    },
                    {
                        "start": (now + datetime.timedelta(minutes=20)).isoformat(),
                        "end": (now + datetime.timedelta(minutes=40)).isoformat(),
                    },
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=60,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=2),
                categories=[],
                estimated_minutes=60,
                completed_minutes=0,
            )

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": now.isoformat(),
                        "end": (now + datetime.timedelta(minutes=70)).isoformat(),
                    },
                    {
                        "start": (now + datetime.timedelta(minutes=70)).isoformat(),
                        "end": (now + datetime.timedelta(minutes=80)).isoformat(),
                    },
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=60,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=3),
                categories=[],
                estimated_minutes=120,
                completed_minutes=0,
            )

        with self.assertRaises(serializers.ValidationError):
            serializer._validate_allocation_slots(
                allocation=[
                    {
                        "start": now.isoformat(),
                        "end": (now + datetime.timedelta(minutes=30)).isoformat(),
                    },
                    {
                        "start": (now + datetime.timedelta(minutes=20)).isoformat(),
                        "end": (now + datetime.timedelta(minutes=50)).isoformat(),
                    },
                ],
                allow_split=True,
                min_split_minutes=15,
                max_split_minutes=60,
                buffer_before_minutes=0,
                buffer_after_minutes=0,
                start_time=now,
                deadline=now + datetime.timedelta(hours=3),
                categories=[],
                estimated_minutes=120,
                completed_minutes=0,
            )
