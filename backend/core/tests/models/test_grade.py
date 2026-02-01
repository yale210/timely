from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
import datetime

from core.models import Grade, Category, Task


class GradeModelTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="guser", password="pwd", email="g@mail.com"
        )

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

    def test_percentage_when_total_zero_and_str(self):
        date = timezone.now().date()
        g = Grade(
            user=self.user,
            name="NoTotal",
            category=None,
            score=5.0,
            total_possible=0.0,
            date_achieved=date,
        )
        self.assertEqual(g.percentage, 0.0)
        self.assertIn("NoTotal", str(g))

    def test_get_time_spent_multiple_tasks(self):
        cat = Category.objects.create(text="Multi")
        date = timezone.now().date()
        # Use make_aware for datetime fields
        start_time_1 = timezone.make_aware(
            datetime.datetime.combine(
                date - datetime.timedelta(days=3), datetime.time.min
            )
        )
        deadline_1 = timezone.make_aware(
            datetime.datetime.combine(date, datetime.time.min)
        )

        g = Grade.objects.create(
            user=self.user,
            name="Gmulti",
            category=cat,
            score=1,
            total_possible=2,
            date_achieved=date,
        )
        t1 = Task.objects.create(
            user=self.user,
            title="T1",
            estimated_minutes=10,
            start_time=start_time_1,
            deadline=deadline_1,
            completed=True,
            importance=1,
        )
        t1.categories.set([cat])

        start_time_2 = timezone.make_aware(
            datetime.datetime.combine(
                date - datetime.timedelta(days=2), datetime.time.min
            )
        )
        deadline_2 = timezone.make_aware(
            datetime.datetime.combine(
                date - datetime.timedelta(days=1), datetime.time.min
            )
        )

        t2 = Task.objects.create(
            user=self.user,
            title="T2",
            estimated_minutes=20,
            start_time=start_time_2,
            deadline=deadline_2,
            completed=True,
            importance=2,
        )
        t2.categories.set([cat])

        self.assertEqual(g.get_time_spent_minutes(), 30)

    def test_get_time_spent_no_category_model(self):
        date = timezone.now().date()
        g = Grade.objects.create(
            user=self.user,
            name="NoCatModel",
            category=None,
            score=2,
            total_possible=4,
            date_achieved=date,
        )
        self.assertEqual(g.get_time_spent_minutes(), 0)
