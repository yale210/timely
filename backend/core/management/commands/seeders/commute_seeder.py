"""Commute Seeder"""

import random
import datetime
from core.models import Commute
from .fixtures import commutes
from django.contrib.auth import get_user_model
from django.core.management.base import BaseSeeder



class CommuteSeeder(BaseSeeder):
    help = "Handles seeding of commutes into the database."

    def seed(self):
        for commute in commutes:
            try:
                self._create_commute(commute)
            except Exception as e:
                pass

    def populate_random_commute(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )
        
        commute_start = self._random_time()
        commute_end = self._random_time()

        if commute_end == commute_start:
            commute_end = self._random_time()

        self._create_commute(
            {
            "user": temporary_user,
            "commute_start": commute_start,
            "commute_end": commute_end,
            }
        )


    def _random_time(self):
        hours = random.randint(0,23)
        minutes = random.randint(0,59)
        return datetime.time(hour=hours,minute=minutes)


    def _create_commute(self,data):
        Commute.objects.get_or_create(
            user = data["user"],
            commute_start = data["commute_start"],
            commute_end = data["commute_end"],
        )

    

#
#    user = models.ForeignKey(
 #       settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="commute"
  #  )
   # commute_start = models.TimeField()
    #commute_end = models.TimeField()
