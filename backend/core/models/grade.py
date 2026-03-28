"""Grade model definition."""

from datetime import datetime, time

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from .category import Category
from .task import Task


class Grade(models.Model):
    """Grade model representing an assessment result for a user."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="grades"
    )

    name = models.CharField(max_length=100, help_text="Assessment name")

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="grades",
    )

    score = models.FloatField(validators=[MinValueValidator(0)])
    total_possible = models.FloatField(validators=[MinValueValidator(1)])
    date_achieved = models.DateField()

    def __str__(self):
        """Return a string representation of the grade.

        Returns:
            str: A string representation of the grade.
        """
        return f"{self.name} ({self.user})"

    @property
    def percentage(self):
        """Return percentage score as a float (0-100).

        Returns:
            float: The percentage score.
        """
        if not self.total_possible:
            return 0.0
        return (self.score / self.total_possible) * 100.0

    def get_time_spent_minutes(self):
        """Sum estimated minutes of completed tasks in this category up to the grade date.

        Returns:
            int: Total estimated minutes spent on tasks inside the category up to the given date.
        """
        if not self.category:
            return 0
        qs = Task.objects.filter(
            user=self.user,
            categories=self.category,
            completed=True,
            deadline__lte=timezone.make_aware(
                datetime.combine(self.date_achieved, time.max)
            ),
        )
        total = qs.aggregate(models.Sum("estimated_minutes"))["estimated_minutes__sum"]
        return int(total or 0)
