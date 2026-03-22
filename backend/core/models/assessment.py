from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Assessment(models.Model):
    """
    Model used to allow for users to create assessments,
    which enable them to keep on top of their upcoming assessments and deadlines.
    """

    class AssessmentType(models.TextChoices):
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

    title = models.CharField(max_length=500)

    module = models.CharField(max_length=100, blank=False)

    assessment_type = models.CharField(
        max_length=255, choices=AssessmentType.choices, default=AssessmentType.SUMMATIVE
    )

    due_date = models.DateTimeField()

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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_date"]

    # Return the assessment.
    def __str__(self):
        return self.title

    def clean(self):
        super().clean()
        errors = {}

        # Ensure title is not empty.
        if not self.title.strip():
            errors["title"] = "Assessment must have a title."

        # Ensure module is not empty.
        if not self.module.strip():
            errors["module"] = "Assessment must have a module."

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
