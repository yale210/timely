"""Special dates model definitions."""

from django.db import models
from django.conf import settings
from holidays.countries.united_kingdom import UnitedKingdom


class SpecialDates(models.Model):
    """This model allows users to create special dates which can be used to help customise scheduling.
    An example could be a birthday, wedding, or any other special occasion.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="special_dates"
    )

    date = models.DateField()
    text = models.CharField(max_length=250, blank=True)

    def __str__(self):
        """Return a string representation of the special date.

        Returns:
            str: A string representation of the special date.
        """
        if self.text:
            return self.text
        else:
            return ""

    def get_holidays_for_year(self, input_year):
        """Get the public holidays for the provided year.
        We use United Kingdom holidays as a default due to the userbase being UK based.

        Args:
            input_year (int): The provided year to retrieve the holidays for.

        Returns:
            list: A list of holiday dates for the year.
        """
        return UnitedKingdom(years=[input_year])
