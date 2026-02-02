"""Event Seeder"""

import random
import datetime
from core.models import Event
from .fixtures import events
from django.contrib.auth import get_user_model
from django.core.management.base import BaseSeeder



class EventSeeder(BaseSeeder):
    help = "Handles seeding of events into the database."

    def seed(self):
        for event in events:
            try:
                self._create_event(event)
            except Exception as e:
                pass

    def populate_random_event(self):
        User = get_user_model()
        # Shuffle users and get a random user.
        temporary_user = User.objects.order_by("?").first()

        if temporary_user is None:
            temporary_user = User.objects.create_user(
                username=self.faker.user_name(),
                email=self.faker.email(),
                password="thomas123",
            )
        
        


    def _random_time(self):
        hours = random.randint(0,23)
        minutes = random.randint(0,59)
        return datetime.time(hour=hours,minute=minutes)


    def _create_event(self,data):
       

