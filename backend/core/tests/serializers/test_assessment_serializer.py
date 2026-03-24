import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from core.models import Category
from core.serializers.assessment import AssessmentSerializer


class AssessmentSerializerTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="assessment-user",
            password="password123",
            email="assessment@example.com",
        )
        self.request = type("obj", (object,), {"user": self.user})

    def test_serializer_creates_assessment_with_categories_and_linked_event(self):
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
