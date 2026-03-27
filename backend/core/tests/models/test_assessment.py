"""Tests for assessment."""

import datetime

from django.core.exceptions import ValidationError
from django.test import TestCase
from core.models import Assessment
from core.tests.factories import AssessmentFactory, UserFactory
from django.utils import timezone


class AssessmentModelTest(TestCase):
    """Test cases for assessment model test."""

    def test_assessment_creation(self):
        """Test assessment creation."""
        assessment = AssessmentFactory()
        self.assertTrue(isinstance(assessment, Assessment))
        self.assertEqual(assessment.__str__(), assessment.title)

    def test_assessment_ordering(self):
        """Test assessment ordering."""
        user = UserFactory()
        a1 = AssessmentFactory(
            user=user, due_date=timezone.now() + datetime.timedelta(days=2)
        )
        a2 = AssessmentFactory(
            user=user, due_date=timezone.now() + datetime.timedelta(days=1)
        )

        assessments = Assessment.objects.filter(user=user)
        self.assertEqual(list(assessments), [a2, a1])

    def test_assessment_clean_valid(self):
        """Test assessment clean valid."""
        assessment = AssessmentFactory.build()
        try:
            assessment.clean()
        except ValidationError:
            self.fail("clean() raised ValidationError unexpectedly!")

    def test_assessment_clean_empty_title(self):
        """Test assessment clean empty title."""
        assessment = AssessmentFactory.build(title="  ")
        with self.assertRaises(ValidationError) as cm:
            assessment.clean()
        self.assertIn("title", cm.exception.message_dict)

    def test_assessment_clean_negative_weighting(self):
        """Test assessment clean negative weighting."""
        assessment = AssessmentFactory.build(weighting_of_assessment=-1)
        with self.assertRaises(ValidationError) as cm:
            assessment.clean()
        self.assertIn("weighting_of_assessment", cm.exception.message_dict)

    def test_assessment_clean_negative_reminder_offset(self):
        """Test assessment clean negative reminder offset."""
        assessment = AssessmentFactory.build(reminder_offset=-1)
        with self.assertRaises(ValidationError) as cm:
            assessment.clean()
        self.assertIn("reminder_offset", cm.exception.message_dict)
