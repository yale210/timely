"""Base Seeder module.

This module defines the abstract base class for all seeder implementations.
It provides common utilities like the Faker instance for generating realistic
dummy data in a consistent locale.
"""

from faker import Faker


class BaseSeeder:
    """The abstract base class for all database seeders.

    This class serves as a foundation for individual seeder classes, ensuring
    a consistent interface and providing shared resources such as data
    generation utilities.

    Attributes:
        faker (Faker): An instance of the Faker library configured for GB English
            locales to generate realistic mock data.

    """

    def __init__(self):
        """Initialize the seeder with a localized Faker instance."""
        self.faker = Faker("en_GB")

    def seed(self):
        """Execute the seeding logic.

        This method must be overridden by all concrete subclasses to implement
        their specific model-level seeding logic, such as loading fixtures
        or generating random records.

        Raises:
            NotImplementedError: If the subclass does not implement this method.

        """
        raise NotImplementedError("Subclass is not implementing the seed method.")
