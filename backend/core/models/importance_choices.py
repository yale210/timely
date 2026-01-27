from django.db import models


class ImportanceChoices(models.IntegerChoices):
    VERY_LOW = 1, "Very low"
    LOW = 2, "Low"
    LOW_MEDIUM = 3, "Low-medium"
    MEDIUM_LOW = 4, "Medium-low"
    MEDIUM = 5, "Medium"
    MEDIUM_HIGH = 6, "Medium-high"
    HIGH_MEDIUM = 7, "High-medium"
    HIGH = 8, "High"
    VERY_HIGH = 9, "Very high"
    CRITICAL = 10, "Critical"
