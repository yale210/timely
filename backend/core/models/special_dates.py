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

    # Retrieve the descriptive text for the special date.
    def __str__(self):
        if self.text:
            return self.text
        else:
            return ""

    # Retrieve all UK holidays for inputted year.
    def get_holidays_for_year(self, input_year):
        return UnitedKingdom(years=[input_year])
