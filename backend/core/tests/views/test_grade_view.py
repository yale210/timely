"""Tests for grade view."""

import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Category, Grade, Task


class GradeViewTests(TestCase):
    """Test cases for grade view."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="viewuser", password="pwd", email="view@user.com"
        )
        self.other = get_user_model().objects.create_user(
            username="other", password="pwd", email="other@user.com"
        )

    def test_unauthenticated_access(self):
        """Test unauthenticated access."""
        res = self.client.get("/api/grades/")
        self.assertIn(res.status_code, (401, 403))

    def test_retrieve_only_own_grades(self):
        """Test retrieve only own grades."""
        Grade.objects.create(
            user=self.other,
            name="Other",
            category=None,
            score=10,
            total_possible=20,
            date_achieved=timezone.now().date(),
        )
        g = Grade.objects.create(
            user=self.user,
            name="Mine",
            category=None,
            score=15,
            total_possible=20,
            date_achieved=timezone.now().date(),
        )
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/grades/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["id"], g.id)

    def test_create_grade_attaches_user(self):
        """Test create grade attaches user."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "name": "New",
            "category": None,
            "score": 12.0,
            "total_possible": 15.0,
            "date_achieved": timezone.now().date().isoformat(),
        }
        res = self.client.post("/api/grades/", payload, format="json")
        self.assertEqual(res.status_code, 201)
        g = Grade.objects.get(id=res.data["id"])
        self.assertEqual(g.user, self.user)

    def test_time_spent_no_category_returns_zero(self):
        """Test time spent no category returns zero."""
        date = timezone.now().date()
        Grade.objects.create(
            user=self.user,
            name="NoCat",
            category=None,
            score=5,
            total_possible=10,
            date_achieved=date,
        )
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/grades/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data[0]["time_spent_minutes"], 0)

    def test_time_spent_category_with_no_tasks(self):
        """Test time spent category with no tasks."""
        cat = Category.objects.create(text="Module")
        date = timezone.now().date()
        Grade.objects.create(
            user=self.user,
            name="EmptyCat",
            category=cat,
            score=5,
            total_possible=10,
            date_achieved=date,
        )
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/grades/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data[0]["time_spent_minutes"], 0)

    def test_time_spent_ignores_future_tasks(self):
        """Test time spent ignores future tasks."""
        cat = Category.objects.create(text="Module2")
        date = timezone.now().date()
        start_time = timezone.make_aware(
            datetime.datetime.combine(date, datetime.time.min)
        )
        deadline = timezone.make_aware(
            datetime.datetime.combine(
                date + datetime.timedelta(days=2), datetime.time.min
            )
        )
        Grade.objects.create(
            user=self.user,
            name="G",
            category=cat,
            score=1,
            total_possible=2,
            date_achieved=date,
        )
        t = Task.objects.create(
            user=self.user,
            title="Later",
            estimated_minutes=30,
            start_time=start_time,
            deadline=deadline,
            completed=True,
            importance=5,
        )
        t.categories.set([cat])
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/grades/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data[0]["time_spent_minutes"], 0)

    def test_time_spent_sums_past_tasks(self):
        """Test time spent sums past tasks."""
        cat = Category.objects.create(text="Module3")
        date = timezone.now().date()
        start_time = timezone.make_aware(
            datetime.datetime.combine(
                date - datetime.timedelta(days=3), datetime.time.min
            )
        )
        deadline = timezone.make_aware(
            datetime.datetime.combine(
                date - datetime.timedelta(days=1), datetime.time.min
            )
        )
        Grade.objects.create(
            user=self.user,
            name="G2",
            category=cat,
            score=1,
            total_possible=2,
            date_achieved=date,
        )
        t = Task.objects.create(
            user=self.user,
            title="Earlier",
            estimated_minutes=45,
            start_time=start_time,
            deadline=deadline,
            completed=True,
            importance=5,
        )
        t.categories.set([cat])
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/grades/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data[0]["time_spent_minutes"], 45)

    def test_update_grade(self):
        """Test update grade."""
        self.client.force_authenticate(user=self.user)
        g = Grade.objects.create(
            user=self.user,
            name="ToEdit",
            category=None,
            score=5,
            total_possible=10,
            date_achieved=timezone.now().date(),
        )
        payload = {
            "name": "Edited",
            "category": None,
            "score": 8.0,
            "total_possible": 10.0,
            "date_achieved": timezone.now().date().isoformat(),
        }
        res = self.client.put(f"/api/grades/{g.id}/", payload, format="json")
        self.assertEqual(res.status_code, 200)
        g.refresh_from_db()
        self.assertEqual(g.name, "Edited")
        self.assertEqual(g.score, 8.0)

    def test_delete_grade(self):
        """Test delete grade."""
        self.client.force_authenticate(user=self.user)
        g = Grade.objects.create(
            user=self.user,
            name="ToDelete",
            category=None,
            score=3,
            total_possible=5,
            date_achieved=timezone.now().date(),
        )
        res = self.client.delete(f"/api/grades/{g.id}/")
        self.assertIn(res.status_code, (204, 202, 200))
        self.assertFalse(Grade.objects.filter(id=g.id).exists())

    def test_category_name_in_serializer(self):
        """Test category name in serializer."""
        cat = Category.objects.create(text="SerializerCat")
        Grade.objects.create(
            user=self.user,
            name="WithCat",
            category=cat,
            score=9,
            total_possible=10,
            date_achieved=timezone.now().date(),
        )
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/grades/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data[0]["category_name"], "SerializerCat")
