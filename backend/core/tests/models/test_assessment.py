from django.contrib.auth import get_user_model
from django.test import TestCase
from core.models import Assessment
from django.core.exceptions import ValidationError
from django.db import IntegrityError


class AssessmentTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="thomas1231321", password="password123", email="thomas@test.com"
        )

        self.assessment = Assessment.objects.create(
            user=self.user,
            title="Large Group Project",
            module="SEG",
            assessment_type=Assessment.AssessmentType.COURSEWORK,
            due_date="2026-04-01T16:00:00Z",
            length_of_assessment=10000,
            weighting_of_assessment=85,
            notes="This is a very important piece of coursework!",
            reminder_offset=30,

        )

    def test_assessment_str_returns_title(self):
        self.assertEqual(str(self.assessment), self.assessment.title)
        
        
    def test_assessment_cannot_have_a_blank_title(self):
        self.assessment = Assessment.objects.create(
            user=self.user,
            title="",
            module="SEG",
            assessment_type=Assessment.AssessmentType.COURSEWORK,
            due_date="2026-04-01T16:00:00Z",
            length_of_assessment=10000,
            weighting_of_assessment=85,
            notes="This is a very important piece of coursework!",
            reminder_offset=30,

        )

        with self.assertRaises(ValidationError):
            self.assessment.full_clean()

    def test_assessment_cannot_have_a_blank_module(self):
        self.assessment = Assessment.objects.create(
            user=self.user,
            title="Large Group Project",
            module="",
            assessment_type=Assessment.AssessmentType.COURSEWORK,
            due_date="2026-04-01T16:00:00Z",
            length_of_assessment=10000,
            weighting_of_assessment=85,
            notes="This is a very important piece of coursework!",
            reminder_offset=30,

        )

        with self.assertRaises(ValidationError):
            self.assessment.full_clean()

    def test_assessment_must_have_a_weighting_between_0_and_100(self):
        self.assessment.weighting_of_assessment = -1
        with self.assertRaises(ValidationError):
            self.assessment.full_clean()

        self.assessment.weighting_of_assessment = 101
        with self.assertRaises(ValidationError):
            self.assessment.full_clean()



    def test_assessment_length_must_be_positive_if_given(self):
        self.assessment.length_of_assessment = -10090
        with self.assertRaises(ValidationError):
            self.assessment.full_clean()

        self.assessment.length_of_assessment = 0
        with self.assertRaises(ValidationError):
            self.assessment.full_clean()

        self.assessment.length_of_assessment = 90
        try:
            self.assessment.full_clean()
        except ValidationError:
            self.fail("Assessment length raised ValidationError despite being valid!")

        
    def test_assessment_reminder_offset_must_be_non_negative_if_provided(self):
        self.assessment.reminder_offset = -100
        with self.assertRaises(ValidationError):
            self.assessment.full_clean()

    

    
    