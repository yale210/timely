from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Category(models.Model):
    """
    Model used to allow for both tasks and events to have assigned categories.
    This allows for easy filtering and sorting.
    """

    text = models.CharField(max_length=20, blank=False, null=False)
    colour = models.CharField(
        max_length=10, blank=True, null=True
    )  # Store the hex code
    max_daily_study_time = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(24)]
    )

    # Return the category.
    def __str__(self):
        return self.text
