"""
Management command to seed the database with initial data.
This calls the smaller individual seeder files.
"""

from django.management.base import BaseCommand

from .seeders.category_seeder import CategorySeeder

class Command(BaseCommand):
    help = "Seeds the database by calling individual seeders."

    #def handle(self, *args, **kwargs):
    