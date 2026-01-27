from django.db import models
from django.utils.timezone import now
from django.conf import settings
from .category import Category
from django.core.validators import MinValueValidator, MaxValueValidator

from .importance_choices import ImportanceChoices


class Task(models.Model):
    """
    This model allows for the creation of tasks.
    Tasks are one-off events. Anything recurring should be an event.
    Tasks may have sub-tasks.
    Examples of tasks may be "Maths coursework" due on the 12th February which will take 4 hours 32 minutes to complete.
    This could have 3 sub-tasks: read textbook; read brief; complete answers.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tasks"
    )

    task_message = models.CharField(max_length=500)
    task_category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="task_category",
    )

    estimated_minutes = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    start_time = models.DateField()
    deadline = models.DateField()
    completed = models.BooleanField(default=False)

    # Query db for models with specific parent tasks when necessary.
    parent_task = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subtasks",
    )

    # 1 represents events of least importance.
    # 10 represents events of most importance.
    importance = models.PositiveSmallIntegerField(
        choices=ImportanceChoices.choices,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
    )

    # Return the time left between now and the deadline.
    def calculateTimeLeft(self):
        current_time = now().date()
        if not self.deadline:
            return 0
        return max((self.deadline - current_time).days, 0)
