"""Assessment model definitions."""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from .category import Category


class Assessment(models.Model):
    """Model used to allow for users to create assessments,
    which enable them to keep on top of their upcoming assessments and deadlines.
    """

    class AssessmentType(models.TextChoices):
        """Supported assessment type values."""

        COURSEWORK = "COURSEWORK", "Coursework"
        EXAM = "EXAM", "Exam"
        QUIZ = "QUIZ", "Quiz"
        PRESENTATION = "PRESENTATION", "Presentation"
        LAB = "PRACTICAL", "Practical"
        FORMATIVE = "FORMATIVE", "Formative"
        SUMMATIVE = "SUMMATIVE", "Summative"
        OTHER = "OTHER", "Other"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assessments"
    )

    title = models.CharField(max_length=500, blank=False)

    assessment_type = models.CharField(
        max_length=255, choices=AssessmentType.choices, default=AssessmentType.SUMMATIVE
    )
    due_date = models.DateTimeField()

    # Length of assessment in minutes
    length_of_assessment = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        null=True,
        blank=True,
    )

    weighting_of_assessment = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    notes = models.TextField(blank=True)

    reminder_offset = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
    )

    linked_event = models.OneToOneField(
        "core.Event",
        on_delete=models.SET_NULL,
        related_name="assessment",
        null=True,
        blank=True,
    )
    assessment_category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        related_name="assessment_category_assessments",
        null=True,
        blank=True,
    )
    module_category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        related_name="assessment_module_assessments",
        null=True,
        blank=True,
    )
    categories = models.ManyToManyField(
        Category,
        blank=True,
        related_name="assessments",
    )
    completed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_date"]

    def __str__(self):
        """Return the assessment title.

        Returns:
            str: The title of the assessment.
        """
        return self.title

    def clean(self):
        """Validate the assessment fields to ensure they meet the required criteria.

        Raises:
            ValidationError: If any of the fields fail validation checks.
        """
        super().clean()
        errors = {}

        # Ensure title is not empty.
        if not self.title.strip():
            errors["title"] = "Assessment must have a title."

        # Ensure the weighting is between 0 and 100 if provided.
        if (
            self.weighting_of_assessment is not None
            and self.weighting_of_assessment < 0
        ):
            errors["weighting_of_assessment"] = (
                "Weighting of assessment must be greater than or equal to 0."
            )

        if self.reminder_offset is not None and self.reminder_offset < 0:
            errors["reminder_offset"] = "Reminder offset cannot be less than 0."

        if errors:
            raise ValidationError(errors)


