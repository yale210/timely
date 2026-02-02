from django.core.exceptions import ValidationError
from django.test import TestCase

from core.models import Category


class CategoryTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(text="Study")

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
