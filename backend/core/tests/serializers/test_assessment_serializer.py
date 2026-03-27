"""Tests for assessment serializer."""

import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from core.models import Category
from core.serializers.assessment_serializer import (
    AssessmentEventInputSerializer,
    AssessmentSerializer,
)


class AssessmentSerializerTests(TestCase):
    """Test cases for assessment serializer."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.user = get_user_model().objects.create_user(
            username="assessment-user",
            password="password123",
            email="assessment@example.com",
        )
        self.request_factory = APIRequestFactory()
        self.request = type("obj", (object,), {"user": self.user})

    def test_event_input_serializer_rejects_end_before_start(self):
        """Test event input serializer rejects end before start."""
        serializer = AssessmentEventInputSerializer(
            data={
                "start_time": timezone.now(),
                "end_time": timezone.now() - datetime.timedelta(minutes=1),
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("end_time", serializer.errors)

    def test_serializer_limits_category_querysets_for_anonymous_request(self):
        """Test serializer limits category querysets for anonymous request."""
        request = self.request_factory.post("/api/assessments/")
        request.user = type("Anonymous", (), {"is_authenticated": False})()

        serializer = AssessmentSerializer(context={"request": request})

        self.assertFalse(serializer.fields["categories"].queryset.exists())
        self.assertFalse(serializer.fields["assessment_category"].queryset.exists())
        self.assertFalse(serializer.fields["module_category"].queryset.exists())

    def test_serializer_creates_assessment_with_categories_and_linked_event(self):
        """Test serializer creates assessment with categories and linked event."""
        category = Category.objects.create(user=self.user, text="Exam")
        module_category = Category.objects.create(user=self.user, text="CS101")
        due_date = timezone.now() + datetime.timedelta(days=10)
        data = {
            "title": "Operating Systems Exam",
            "assessment_type": "EXAM",
            "due_date": due_date,
            "weighting_of_assessment": 40,
            "notes": "Bring calculator",
            "reminder_offset": 60,
            "categories": [category.id],
            "assessment_category": category.id,
            "module_category": module_category.id,
            "event_details": {
                "start_time": due_date - datetime.timedelta(hours=2),
                "end_time": due_date - datetime.timedelta(hours=1),
                "location": "Room A1",
            },
        }

        serializer = AssessmentSerializer(data=data, context={"request": self.request})
        self.assertTrue(serializer.is_valid(), serializer.errors)

        assessment = serializer.save()

        self.assertEqual(assessment.categories.count(), 1)
        self.assertEqual(assessment.categories.first(), category)
        self.assertEqual(assessment.assessment_category, category)
        self.assertEqual(assessment.module_category, module_category)
        self.assertIsNotNone(assessment.linked_event)
        self.assertEqual(assessment.linked_event.title, assessment.title)
        self.assertEqual(assessment.linked_event.location, "Room A1")
        self.assertEqual(assessment.linked_event.reminders.count(), 1)

    def test_serializer_removes_linked_event_when_event_details_null(self):
        """Test serializer removes linked event when event details null."""
        due_date = timezone.now() + datetime.timedelta(days=10)
        serializer = AssessmentSerializer(
            data={
                "title": "Exam",
                "assessment_type": "EXAM",
                "due_date": due_date,
                "weighting_of_assessment": 30,
                "event_details": {
                    "start_time": due_date - datetime.timedelta(hours=2),
                    "end_time": due_date - datetime.timedelta(hours=1),
                    "location": "Hall",
                },
            },
            context={"request": self.request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        assessment = serializer.save()

        update_serializer = AssessmentSerializer(
            instance=assessment,
            data={"event_details": None},
            partial=True,
            context={"request": self.request},
        )
        self.assertTrue(update_serializer.is_valid(), update_serializer.errors)
        updated_assessment = update_serializer.save()

        self.assertIsNone(updated_assessment.linked_event)

    def test_to_representation_includes_null_category_fields_without_linked_event(self):
        """Test to representation includes null category fields without linked event."""
        due_date = timezone.now() + datetime.timedelta(days=10)
        serializer = AssessmentSerializer(
            data={
                "title": "Representation test",
                "assessment_type": "EXAM",
                "due_date": due_date,
                "weighting_of_assessment": 20,
            },
            context={"request": self.request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        assessment = serializer.save()

        data = AssessmentSerializer(
            instance=assessment, context={"request": self.request}
        ).data

        self.assertIsNone(data["assessment_category"])
        self.assertIsNone(data["module_category"])
        self.assertEqual(data["categories"], [])
        self.assertIsNone(
            AssessmentSerializer(
                context={"request": self.request}
            ).get_linked_event_details(assessment)
        )

    def test_serializer_rejects_event_start_after_due_date(self):
        """Test serializer rejects event start after due date."""
        due_date = timezone.now() + datetime.timedelta(days=7)
        serializer = AssessmentSerializer(
            data={
                "title": "Late event",
                "assessment_type": "EXAM",
                "due_date": due_date,
                "weighting_of_assessment": 50,
                "event_details": {
                    "start_time": due_date + datetime.timedelta(minutes=1),
                    "end_time": due_date + datetime.timedelta(hours=1),
                    "location": "Hall",
                },
            },
            context={"request": self.request},
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("event_details", serializer.errors)

    def test_update_without_event_details_syncs_existing_linked_event_and_reminders(
        self,
    ):
        """Test update without event details syncs existing linked event and reminders."""
        category = Category.objects.create(user=self.user, text="Exam")
        due_date = timezone.now() + datetime.timedelta(days=10)
        serializer = AssessmentSerializer(
            data={
                "title": "Networks Exam",
                "assessment_type": "EXAM",
                "due_date": due_date,
                "weighting_of_assessment": 40,
                "notes": "Old notes",
                "reminder_offset": 30,
                "categories": [category.id],
                "event_details": {
                    "start_time": due_date - datetime.timedelta(hours=2),
                    "end_time": due_date - datetime.timedelta(hours=1),
                    "location": "Room A1",
                },
            },
            context={"request": self.request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        assessment = serializer.save()

        update_serializer = AssessmentSerializer(
            instance=assessment,
            data={
                "title": "Updated Networks Exam",
                "notes": "Updated notes",
                "reminder_offset": None,
            },
            partial=True,
            context={"request": self.request},
        )
        self.assertTrue(update_serializer.is_valid(), update_serializer.errors)
        updated_assessment = update_serializer.save()

        updated_assessment.refresh_from_db()
        linked_event = updated_assessment.linked_event
        self.assertIsNotNone(linked_event)
        self.assertEqual(linked_event.title, "Updated Networks Exam")
        self.assertEqual(linked_event.description, "Updated notes")
        self.assertEqual(linked_event.categories.count(), 1)
        self.assertEqual(linked_event.categories.first(), category)
        self.assertEqual(linked_event.reminders.count(), 0)

    def test_update_with_event_details_updates_existing_linked_event(self):
        """Test update with event details updates existing linked event."""
        category = Category.objects.create(user=self.user, text="Coursework")
        due_date = timezone.now() + datetime.timedelta(days=10)
        serializer = AssessmentSerializer(
            data={
                "title": "Algorithms Coursework",
                "assessment_type": "COURSEWORK",
                "due_date": due_date,
                "weighting_of_assessment": 25,
                "notes": "Initial notes",
                "categories": [category.id],
                "event_details": {
                    "start_time": due_date - datetime.timedelta(hours=3),
                    "end_time": due_date - datetime.timedelta(hours=2),
                    "location": "Online",
                },
            },
            context={"request": self.request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        assessment = serializer.save()
        original_event_id = assessment.linked_event_id

        update_category = Category.objects.create(user=self.user, text="Updated")
        update_serializer = AssessmentSerializer(
            instance=assessment,
            data={
                "notes": "Updated event payload",
                "categories": [update_category.id],
                "event_details": {
                    "start_time": due_date - datetime.timedelta(hours=1),
                    "end_time": due_date,
                    "location": "Lab 2",
                },
            },
            partial=True,
            context={"request": self.request},
        )
        self.assertTrue(update_serializer.is_valid(), update_serializer.errors)
        updated_assessment = update_serializer.save()

        updated_assessment.refresh_from_db()
        self.assertEqual(updated_assessment.linked_event_id, original_event_id)
        self.assertEqual(updated_assessment.linked_event.location, "Lab 2")
        self.assertEqual(
            updated_assessment.linked_event.description, "Updated event payload"
        )
        self.assertEqual(
            updated_assessment.linked_event.categories.first(), update_category
        )



