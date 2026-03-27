"""Factory helpers shared across core app tests."""

import datetime

import factory
from django.contrib.auth import get_user_model
from django.utils import timezone

from core.models import Assessment, Category, Task
from profiles.models.profile import Profile

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    """Create test users with an associated profile by default."""

    class Meta:
        """Test cases for meta."""
        model = User

    username = factory.Sequence(lambda n: f"user_{n}")
    email = factory.Sequence(lambda n: f"user_{n}@example.com")
    password = factory.PostGenerationMethodCall("set_password", "password123")

    @factory.post_generation
    def create_profile(obj, create, extracted, **kwargs):
        """Ensure user-based tests also have the related profile record."""

        if not create:
            return
        Profile.objects.get_or_create(user=obj, defaults={"name": obj.username})


class AssessmentFactory(factory.django.DjangoModelFactory):
    """Create assessments with sensible default scheduling values."""

    class Meta:
        """Test cases for meta."""
        model = Assessment

    user = factory.SubFactory(UserFactory)
    title = factory.Sequence(lambda n: f"Assessment {n}")
    assessment_type = "SUMMATIVE"
    due_date = factory.LazyFunction(lambda: timezone.now() + datetime.timedelta(days=7))
    weighting_of_assessment = 10
    length_of_assessment = 120
    reminder_offset = 60
    completed = False


class CategoryFactory(factory.django.DjangoModelFactory):
    """Create categories scoped to the generated test user."""

    class Meta:
        """Test cases for meta."""
        model = Category

    user = factory.SubFactory(UserFactory)
    text = factory.Sequence(lambda n: f"Category {n}")
    colour = "#FFFFFF"


class TaskFactory(factory.django.DjangoModelFactory):
    """Create tasks with short default scheduling windows for tests."""

    class Meta:
        """Test cases for meta."""
        model = Task

    user = factory.SubFactory(UserFactory)
    title = factory.Sequence(lambda n: f"Task {n}")
    estimated_minutes = 60
    start_time = factory.LazyFunction(timezone.now)
    deadline = factory.LazyFunction(lambda: timezone.now() + datetime.timedelta(days=1))
    importance = 5
    completed = False
