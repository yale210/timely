"""Tests for category serializer."""

from django.contrib.auth import get_user_model
from django.test import TestCase

from core.models import Category
from core.serializers import CategorySerializer


class CategorySerializerTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="categoryserializer",
            password="password123",
            email="category@user.com",
        )

    def test_category_serializer_includes_max_daily_study_time(self):
        category = Category.objects.create(
            user=self.user,
            text="Study",
            max_daily_study_time=180,
        )

        data = CategorySerializer(category).data

        self.assertEqual(data["max_daily_study_time"], 180)

    def test_category_serializer_accepts_max_daily_study_time(self):
        serializer = CategorySerializer(
            data={
                "text": "Reading",
                "max_daily_study_time": 120,
            },
            context={"request": type("Request", (), {"user": self.user})()},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        category = serializer.save()

        self.assertEqual(category.max_daily_study_time, 120)
