from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.conf import settings
from django.utils.timezone import now


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
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assessments"
    )

    title = models.CharField(max_length=500, default="Unnamed Assessment")

    module = models.CharField(max_length=255, blank=True, default="Unknown Module")

    assessment_type = models.CharField(max_length=255, blank=True, default="Summative")

    due_date = models.DateTimeField()

    length_of_assessment = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        null=True,
        blank=True,
    )

    weighting_of_assessment = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        null=True,
        blank=True,
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

    created_at = models.DateTimeField(default=now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_date"]


    

    # Return the assessment.
    def __str__(self):
        return self.title
