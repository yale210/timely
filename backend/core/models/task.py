from django.db import models
from django.utils.timezone import now
from django.conf import settings
from .category import Category
from django.core.validators import MinValueValidator, MaxValueValidator


# A user can create a task. A task belongs to that user.
class Task(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tasks"
    )

    task_message = models.CharField(max_length=500)
    task_category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="category",
    )

    estimated_minutes = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(24 * 60)]
    )
    start_time = models.DateField()
    completed = models.BooleanField(default=False)
    deadline = models.DateField()

    # Query db for models with specific parent tasks when necessary.
    parent_task = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subtasks",
    )

    # 1 least important, 10 insanely urgent
    importance = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )

    recurring = models.BooleanField(default=False)
    recurring_start = models.DateField(null=True, blank=True)
    recurring_end = models.DateField(null=True, blank=True)

    def calculateTimeLeft(self):
        current_time = now().date()

        if self.recurring and self.recurring_end:
            return (self.recurring_end - current_time).days

        if self.deadline:
            return (self.deadline - current_time).days

        return 0
