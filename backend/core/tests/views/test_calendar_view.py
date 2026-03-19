from rest_framework.test import APITestCase
from rest_framework import status
from core.tests.factories import UserFactory, TaskFactory, CategoryFactory
from core.models import Task, Category


class CalendarViewTests(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
        self.category = CategoryFactory(user=self.user)
        self.task = TaskFactory(user=self.user)
        self.task.categories.add(self.category)

    def test_task_retrieve(self):
        response = self.client.get(f"/api/tasks/{self.task.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.task.id)

    def test_task_update_level_up(self):
        data = {
            "title": "Updated Task",
            "estimated_minutes": 90,
            "importance": 8,
            "start_time": self.task.start_time.isoformat(),
            "deadline": self.task.deadline.isoformat(),
        }

        response = self.client.put(f"/api/tasks/{self.task.id}/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("level_up", response.data)
        self.assertIn("new_level", response.data)
        self.assertIn("xp", response.data)

    def test_task_partial_update(self):
        data = {"title": "Partially Updated Task"}
        response = self.client.patch(f"/api/tasks/{self.task.id}/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Partially Updated Task")
        self.assertIn("level_up", response.data)

    def test_task_destroy(self):
        response = self.client.delete(f"/api/tasks/{self.task.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=self.task.id).exists())

    def test_category_list(self):
        response = self.client.get("/api/categories/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)

    def test_category_create(self):
        data = {"text": "New Category", "colour": "#FF0000"}
        response = self.client.post("/api/categories/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.filter(text="New Category").count(), 1)

    def test_category_retrieve(self):
        response = self.client.get(f"/api/categories/{self.category.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["text"], self.category.text)

    def test_category_update(self):
        data = {"text": "Updated Category", "user": self.user.id}
        response = self.client.put(
            f"/api/categories/{self.category.id}/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["text"], "Updated Category")

    def test_category_destroy(self):
        response = self.client.delete(f"/api/categories/{self.category.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Category.objects.filter(id=self.category.id).exists())
