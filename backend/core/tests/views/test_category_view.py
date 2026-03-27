"""Tests for category view."""

from rest_framework.test import APITestCase
from rest_framework import status
from core.tests.factories import UserFactory, CategoryFactory
from core.models import Category


class CategoryViewTests(APITestCase):
    """Test cases for category view."""

    def setUp(self):
        """Set up shared test fixtures."""
        self.user = UserFactory()
        self.other_user = UserFactory()
        self.client.force_authenticate(user=self.user)
        self.category = CategoryFactory(user=self.user, text="My Category")
        self.other_category = CategoryFactory(
            user=self.other_user, text="Other Category"
        )
        self.url = "/api/categories/"

    def test_list_categories_filtered_by_user(self):
        """Test list categories filtered by user."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see own categories
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["text"], "My Category")

    def test_create_category_associates_user(self):
        """Test create category associates user."""
        data = {"text": "New Cat", "colour": "#00FF00"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_cat = Category.objects.get(text="New Cat")
        self.assertEqual(new_cat.user, self.user)
