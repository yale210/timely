from datetime import datetime, timedelta

from django.core.exceptions import ValidationError
from django.db import models

from django.conf import settings
from core.models.day_of_week import DayOfWeek


class Preference(models.Model):

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    sleep_start = models.TimeField()
    sleep_end = models.TimeField()

    days_off = models.ManyToManyField(DayOfWeek, blank=True)

    max_tasks_per_day = models.IntegerField(default=3) #Maximum number of tasks that can be scheduled in a day

    max_schedule_ahead_days = models.IntegerField(default=14) #Schedule upto 2 weeks ahead

    timezone_offset = models.IntegerField(default=0)#Offset in hours from UTC

    def clean(self):
        super().clean()
        if self.sleep_start == self.sleep_end:
            raise ValidationError({'sleep_end': 'sleep_start must be different to sleep_end'})

        start = datetime.combine(datetime.today(), self.sleep_start)
        end = datetime.combine(datetime.today(), self.sleep_end)
        if end <= start:
            end += datetime.timedelta(days=1)
