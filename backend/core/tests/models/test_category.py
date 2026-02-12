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

<<<<<<< HEAD

# text = models.CharField(max_length=20, blank=False, null=False)
# colour = models.CharField(
#    max_length=10, blank=True, null=True
# )  # Store the hex code
# max_daily_study_time = models.PositiveSmallIntegerField(
#    validators=[MinValueValidator(0), MaxValueValidator(24)],
#    null=True,
#    blank=True,
# )
=======
    def test_category_max_daily_study_time_allows_bounds(self):
        self.category.max_daily_study_time = 0
        self.category.full_clean()

        self.category.max_daily_study_time = 24
        self.category.full_clean()

    def test_category_max_daily_study_time_rejects_out_of_bounds(self):
        self.category.max_daily_study_time = -1
        with self.assertRaises(ValidationError):
            self.category.full_clean()

        self.category.max_daily_study_time = 25
        with self.assertRaises(ValidationError):
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
>>>>>>> main
