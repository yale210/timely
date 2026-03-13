from django.db import models
from django.utils.timezone import now
from django.conf import settings
from django.core.exceptions import ValidationError
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

    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    categories = models.ManyToManyField(
        Category,
        blank=True,
        related_name="tasks",
    )
    colour = models.CharField(max_length=7, blank=True, null=True)

    estimated_minutes = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    start_time = models.DateTimeField()
    deadline = models.DateTimeField()
    completed = models.BooleanField(default=False)
    locked = models.BooleanField(default=False)
    allow_split = models.BooleanField(default=False)

    # Query db for models with specific parent tasks when necessary.
    parent_task = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subtasks",
    )

    total_task_allocations = models.PositiveIntegerField(default=0)
    allocation = models.JSONField(default=list, blank=True, null=True)

    # 1 represents tasks of least importance.
    # 10 represents tasks of most importance.
    importance = models.PositiveSmallIntegerField(
        choices=ImportanceChoices.choices,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
    )

    # Return the time left between now and the deadline.
    def calculate_time_left(self):
        current_time = now().date()
        if not self.deadline:
            return 0
        deadline_date = self.deadline.date()
        if deadline_date < current_time:
            return 0
        return (deadline_date - current_time).days

    def clean(self):
        if self.start_time and self.deadline and self.start_time > self.deadline:
            raise ValidationError("Start time must be before or on the deadline.")
        super().clean()
