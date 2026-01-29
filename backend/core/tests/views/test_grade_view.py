import datetime

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework.test import APIClient

from core.models import Grade, Category, Task


class GradeViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="viewuser", password="pwd"
        )
        self.other = get_user_model().objects.create_user(
            username="other", password="pwd"
        )

    def test_unauthenticated_access(self):
        res = self.client.get("/api/grades/")
        self.assertIn(res.status_code, (401, 403))

    def test_retrieve_only_own_grades(self):
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
        cat = Category.objects.create(text="Module2")
        date = timezone.now().date()
        Grade.objects.create(
            user=self.user,
            name="G",
            category=cat,
            score=1,
            total_possible=2,
            date_achieved=date,
        )
        Task.objects.create(
            user=self.user,
            task_message="Later",
            task_category=cat,
            estimated_minutes=30,
            start_time=date,
            deadline=date + datetime.timedelta(days=2),
            completed=True,
            importance=5,
        )
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/grades/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data[0]["time_spent_minutes"], 0)

    def test_time_spent_sums_past_tasks(self):
        cat = Category.objects.create(text="Module3")
        date = timezone.now().date()
        Grade.objects.create(
            user=self.user,
            name="G2",
            category=cat,
            score=1,
            total_possible=2,
            date_achieved=date,
        )
        Task.objects.create(
            user=self.user,
            task_message="Earlier",
            task_category=cat,
            estimated_minutes=45,
            start_time=date - datetime.timedelta(days=3),
            deadline=date - datetime.timedelta(days=1),
            completed=True,
            importance=5,
        )
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/grades/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data[0]["time_spent_minutes"], 45)

    def test_update_grade(self):
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
