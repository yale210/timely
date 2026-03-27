"""Tests for category."""

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.contrib.auth import get_user_model

from core.models import Category


class CategoryTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            text="Study",
            user=get_user_model().objects.create_user(
                username="testuser", password="password123", email="test@user.com"
            ),
        )

    def test_category_str(self):
        self.assertEqual(str(self.category), "Study")

    def test_category_can_be_20_characters(self):
        self.category.text = "a" * 20
        self.category.full_clean()

    def test_category_cannot_be_21_characters_long(self):
        self.category.text = "a" * 21
        with self.assertRaises(ValidationError):
            self.category.full_clean()

    def test_category_cannot_be_blank(self):
        with self.assertRaises(ValidationError):
            self.category.text = ""
            self.category.full_clean()

    def test_category_colour_accepts_hex_code(self):
        self.category.colour = "#A1B2C3"
        self.category.full_clean()

    def test_category_colour_rejects_invalid_hex_code(self):
        self.category.colour = "A1B2C3"
        with self.assertRaises(ValidationError):
            self.category.full_clean()

        self.category.colour = "#ABC"
        with self.assertRaises(ValidationError):
            self.category.full_clean()

        self.category.colour = "#A1B2C3D4"
        with self.assertRaises(ValidationError):
            self.category.full_clean()

        self.category.colour = "#A1B2CG"
        with self.assertRaises(ValidationError):
            self.category.full_clean()
