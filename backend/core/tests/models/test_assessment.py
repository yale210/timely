from django.test import TestCase
from django.core.exceptions import ValidationError
from core.tests.factories import AssessmentFactory, UserFactory
from core.models import Assessment
from django.utils import timezone
import datetime


class AssessmentModelTest(TestCase):
    def test_assessment_creation(self):
        assessment = AssessmentFactory()
        self.assertTrue(isinstance(assessment, Assessment))
        self.assertEqual(assessment.__str__(), assessment.title)

    def test_assessment_ordering(self):
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
        assessment = AssessmentFactory.build()
        try:
            assessment.clean()
        except ValidationError:
            self.fail("clean() raised ValidationError unexpectedly!")

    def test_assessment_clean_empty_title(self):
        assessment = AssessmentFactory.build(title="  ")
        with self.assertRaises(ValidationError) as cm:
            assessment.clean()
        self.assertIn("title", cm.exception.message_dict)

    def test_assessment_clean_empty_module(self):
        assessment = AssessmentFactory.build(module="  ")
        with self.assertRaises(ValidationError) as cm:
            assessment.clean()
        self.assertIn("module", cm.exception.message_dict)

    def test_assessment_clean_negative_weighting(self):
        assessment = AssessmentFactory.build(weighting_of_assessment=-1)
        with self.assertRaises(ValidationError) as cm:
            assessment.clean()
        self.assertIn("weighting_of_assessment", cm.exception.message_dict)

    def test_assessment_clean_negative_reminder_offset(self):
        assessment = AssessmentFactory.build(reminder_offset=-1)
        with self.assertRaises(ValidationError) as cm:
            assessment.clean()
        self.assertIn("reminder_offset", cm.exception.message_dict)
