from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.conf import settings


class Category(models.Model):
    """
    Model used to allow for both tasks and events to have assigned categories.
    This allows for easy filtering and sorting.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
        null=True,
        blank=False,
    )
    text = models.CharField(max_length=20, blank=False, null=False)
    colour = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                regex=r"^#[0-9A-Fa-f]{6}$",
                message="Colour must be a hex code in the format #RRGGBB.",
            )
        ],
    )
    max_daily_study_time = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(1440)],
        null=True,
        blank=True,
    )
    colour_override = models.BooleanField(default=False)

    # Return the category.
    def __str__(self):
        return self.text
