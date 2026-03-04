"""Base Seeder"""

from faker import Faker


class BaseSeeder:
    """The Base Class for all similar seeders."""

    def __init__(self):
        self.faker = Faker("en_GB")

    def seed(self):
        """Must be overridden by subclasses to implement own seeding logic"""
        raise NotImplementedError("Subclass is not implementing the seed method.")
