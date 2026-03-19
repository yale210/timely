import factory
from django.contrib.auth import get_user_model
from core.models import Task, Category, Assessment
from profiles.models.profile import Profile
from django.utils import timezone
import datetime

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user_{n}")
    email = factory.Sequence(lambda n: f"user_{n}@example.com")
    password = factory.PostGenerationMethodCall("set_password", "password123")

    @factory.post_generation
    def create_profile(obj, create, extracted, **kwargs):
        if not create:
            return
        Profile.objects.get_or_create(user=obj, defaults={"name": obj.username})


class AssessmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Assessment

    user = factory.SubFactory(UserFactory)
    title = factory.Sequence(lambda n: f"Assessment {n}")
    module = factory.Sequence(lambda n: f"Module {n}")
    assessment_type = "SUMMATIVE"
    due_date = factory.LazyFunction(lambda: timezone.now() + datetime.timedelta(days=7))
    weighting_of_assessment = 10
    length_of_assessment = 120
    reminder_offset = 60


class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Category

    user = factory.SubFactory(UserFactory)
    text = factory.Sequence(lambda n: f"Category {n}")
    colour = "#FFFFFF"


class TaskFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Task

    user = factory.SubFactory(UserFactory)
    title = factory.Sequence(lambda n: f"Task {n}")
    estimated_minutes = 60
    start_time = factory.LazyFunction(timezone.now)
    deadline = factory.LazyFunction(lambda: timezone.now() + datetime.timedelta(days=1))
    importance = 5
    completed = False
