from django.db import models


class Category(models.Model):
    """
    Model used to allow for both tasks and events to have assigned categories.
    This allows for easy filtering and sorting.
    """

    text = models.CharField(max_length=20, unique=True, blank=False, null=False)

    # Return the category.
    def __str__(self):
        return self.text
