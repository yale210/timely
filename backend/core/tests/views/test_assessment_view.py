"""Tests for assessment view."""

import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from rest_framework.test import APIClient

from core.models import Assessment, Category


class AssessmentViewTests(TestCase):
    """Test cases for assessment view."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="assessment-view-user",
            password="pwd",
            email="assessment-view@example.com",
        )
        self.other = get_user_model().objects.create_user(
            username="assessment-other-user",
            password="pwd",
            email="assessment-other@example.com",
        )

    def test_retrieve_only_own_assessments(self):
        """Test retrieve only own assessments."""
        Assessment.objects.create(
            user=self.other,
            title="Other assessment",
            assessment_type="OTHER",
            due_date=timezone.now() + datetime.timedelta(days=7),
            weighting_of_assessment=20,
        )
        mine = Assessment.objects.create(
            user=self.user,
            title="My assessment",
            assessment_type="EXAM",
            due_date=timezone.now() + datetime.timedelta(days=2),
            weighting_of_assessment=60,
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/assessments/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], mine.id)

    def test_create_assessment_with_category_and_event(self):
        """Test create assessment with category and event."""
        category = Category.objects.create(user=self.user, text="Exam")
        module_category = Category.objects.create(user=self.user, text="Algorithms")
        due_date = timezone.now() + datetime.timedelta(days=3)

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/assessments/",
            {
                "title": "Algorithms exam",
                "assessment_type": "EXAM",
                "due_date": due_date.isoformat(),
                "weighting_of_assessment": 50,
                "categories": [category.id],
                "assessment_category": category.id,
                "module_category": module_category.id,
                "event_details": {
                    "start_time": (due_date - datetime.timedelta(hours=2)).isoformat(),
                    "end_time": (due_date - datetime.timedelta(hours=1)).isoformat(),
                    "location": "Exam hall",
                },
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        assessment = Assessment.objects.get(id=response.data["id"])
        self.assertEqual(assessment.user, self.user)
        self.assertEqual(
            list(assessment.categories.values_list("id", flat=True)), [category.id]
        )
        self.assertEqual(assessment.assessment_category, category)
        self.assertEqual(assessment.module_category, module_category)
        self.assertIsNotNone(assessment.linked_event)

    def test_delete_assessment_removes_linked_event(self):
        """Test delete assessment removes linked event."""
        due_date = timezone.now() + datetime.timedelta(days=3)
        assessment = Assessment.objects.create(
            user=self.user,
            title="Delete me",
            assessment_type="EXAM",
            due_date=due_date,
            weighting_of_assessment=25,
        )
        event = self.user.events.create(
            title="Delete me",
            start_time=due_date - datetime.timedelta(hours=2),
            end_time=due_date - datetime.timedelta(hours=1),
        )
        assessment.linked_event = event
        assessment.save(update_fields=["linked_event"])

        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/assessments/{assessment.id}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Assessment.objects.filter(id=assessment.id).exists())
        self.assertFalse(self.user.events.filter(id=event.id).exists())
