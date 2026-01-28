import datetime

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone

from core.models import Grade, Category


class GradeModelTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="guser", password="pwd")

    def test_valid_grade_creation(self):
        cat = Category.objects.create(text="Coursework")
        g = Grade.objects.create(
            user=self.user,
            name="Assessment 1",
            category=cat,
            score=40.0,
            total_possible=50.0,
            date_achieved=timezone.now().date(),
        )
        self.assertEqual(str(g), f"Assessment 1 ({self.user})")

    def test_percentage_calculation(self):
        g = Grade.objects.create(
            user=self.user,
            name="A",
            category=None,
            score=25.0,
            total_possible=50.0,
            date_achieved=timezone.now().date(),
        )
        self.assertEqual(g.percentage, 50.0)

    def test_total_possible_validation(self):
        g = Grade(
            user=self.user,
            name="Bad",
            category=None,
            score=10.0,
            total_possible=0.0,
            date_achieved=timezone.now().date(),
        )
        with self.assertRaises(ValidationError):
            g.full_clean()
