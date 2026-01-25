import datetime
from unittest.mock import Mock

from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from django.utils import timezone
from django.urls import resolve
from rest_framework.test import APIClient

from core.models import (
    Category,
    Commute,
    Event,
    Preference,
    Profile,
    SpecialDates,
    Task,
)
from core.serializers import CalendarSerializer
from core.views.calendar_view import TaskViewSet


class ModelTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="testuser",
            password="password123",
        )
        self.profile = Profile.objects.create(
            user=self.user, date_of_birth=datetime.date(2006, 4, 20)
        )
        self.category = Category.objects.create(text="Study")

    def test_category_str(self):
        self.assertEqual(str(self.category), "Study")

    def test_category_can_be_20_characters(self):
        self.category.text = "a" * 20
        self.category.full_clean()

    def test_category_cannot_be_21_characters_long(self):
        self.category.text = "a" * 21
        with self.assertRaises(ValidationError):
            self.category.full_clean()

    def test_category_cannot_be_blank(self):
        with self.assertRaises(ValidationError):
            self.category.text = ""
            self.category.full_clean()

    def test_category_must_be_unique(self):
        with self.assertRaises(ValidationError):
            second_category = Category("Study")
            second_category.full_clean()

    def test_profile_str(self):
        self.assertEqual(str(self.profile), str(self.user))

    def test_valid_profile(self):
        self.profile.full_clean()

    def test_profile_can_have_a_date_of_birth(self):
        dob = datetime.date(2006, 2, 24)
        self.profile.date_of_birth = dob

        self.assertEqual(self.profile.date_of_birth, dob)

    def test_profile_can_have_null_date_of_birth(self):
        self.profile.date_of_birth = None

        self.assertIsNone(self.profile.date_of_birth)

    def test_commute_can_be_created(self):
        commute = Commute.objects.create(
            user=self.user,
            commute_start=datetime.time(8, 0),
            commute_end=datetime.time(9, 0),
        )

        self.assertEqual(commute.user, self.user)

    def test_commute_str(self):
        commute = Commute.objects.create(
            user=self.user,
            commute_start=datetime.time(8, 0),
            commute_end=datetime.time(9, 0),
        )

        self.assertEqual(str(commute), "08:00:00 - 09:00:00")

    def test_user_can_have_multiple_commutes(self):
        Commute.objects.create(
            user=self.user,
            commute_start=datetime.time(8, 0),
            commute_end=datetime.time(9, 0),
        )
        Commute.objects.create(
            user=self.user,
            commute_start=datetime.time(18, 0),
            commute_end=datetime.time(19, 0),
        )
        self.assertEqual(self.user.commute.count(), 2)

    def test_special_dates_str_with_text(self):
        special_date = SpecialDates.objects.create(
            user=self.user,
            date=datetime.date(2025, 1, 1),
            text="New Year",
        )

        self.assertEqual(str(special_date), "New Year")

    def test_special_dates_str_without_text(self):
        special_date = SpecialDates.objects.create(
            user=self.user,
            date=datetime.date(2025, 1, 2),
            text="",
        )

        self.assertEqual(str(special_date), "")

    def test_special_date_can_be_linked_to_a_user(self):
        special_date = SpecialDates.objects.create(
            user=self.user,
            date=datetime.date(2026, 1, 25),
            text="Day in bed",
        )

        self.assertEqual(special_date.user, self.user)
        self.assertEqual(self.user.special_dates.count(), 1)

    def test_event_calculate_time_left(self):
        today = timezone.now().date()
        event = Event.objects.create(
            user=self.user,
            event_category=None,
            time=datetime.time(10, 0),
            date=today,
            importance=5,
            recurring=True,
            recurring_start=today,
            recurring_end=today + datetime.timedelta(days=10),
            recurring_interval="daily",
        )

        self.assertEqual(event.calculateTimeLeft(), 10)

    def test_event_calculate_time_left_zero_days(self):
        event = Event.objects.create(
            user=self.user,
            event_category=None,
            time=datetime.time(10, 0),
            date=datetime.date(2025, 1, 1),
            importance=5,
            recurring=False,
        )

        self.assertEqual(event.calculateTimeLeft(), 0)

    def test_event_calculate_time_left_one_off_event(self):
        today = timezone.now().date()
        event = Event.objects.create(
            user=self.user,
            event_category=None,
            time=datetime.time(10, 0),
            date=today + datetime.timedelta(days=10),
            importance=5,
            recurring=False,
        )

        self.assertEqual(event.calculateTimeLeft(), 10)

    def test_event_is_linked_to_user(self):
        today = timezone.now().date()
        event = Event.objects.create(
            user=self.user,
            event_category=None,
            time=datetime.time(10, 0),
            date=today,
            importance=5,
            recurring=False,
        )

        self.assertEqual(event.user, self.user)
        self.assertEqual(self.user.events.count(), 1)

    def test_task_calculate_time_left_is_overdue_returns_zero(self):
        today = timezone.now().date()
        task = Task.objects.create(
            user=self.user,
            task_message="Overdue task",
            task_category=None,
            estimated_minutes=45,
            start_time=today,
            completed=False,
            deadline=today - datetime.timedelta(days=10),
            importance=10,
        )

        self.assertEqual(task.calculateTimeLeft(), 0)

    def test_task_calculate_time_left_deadline(self):
        today = timezone.now().date()
        task = Task.objects.create(
            user=self.user,
            task_message="Deadline task",
            task_category=None,
            estimated_minutes=45,
            start_time=today,
            completed=False,
            deadline=today + datetime.timedelta(days=5),
            importance=7,
        )

        self.assertEqual(task.calculateTimeLeft(), 5)

    def test_task_calculate_time_left_no_dates(self):
        today = timezone.now().date()
        task = Task.objects.create(
            user=self.user,
            task_message="No date task",
            task_category=None,
            estimated_minutes=60,
            start_time=today,
            completed=False,
            deadline=today,
            importance=7,
        )

        self.assertEqual(task.calculateTimeLeft(), 0)

    def test_tasks_can_have_subtasks(self):
        today = timezone.now().date()
        parent = Task.objects.create(
            user=self.user,
            task_message="Parent task",
            task_category=None,
            estimated_minutes=60,
            start_time=today,
            completed=False,
            deadline=today,
            importance=7,
        )

        child = Task.objects.create(
            user=self.user,
            task_message="child task",
            task_category=None,
            estimated_minutes=600,
            start_time=today,
            completed=False,
            deadline=today,
            importance=7,
            parent_task=parent,
        )

        self.assertEqual(parent.subtasks.count(), 1)
        self.assertEqual(child.parent_task, parent)

    def test_task_is_linked_to_user(self):
        today = timezone.now().date()
        task = Task.objects.create(
            user=self.user,
            task_message="user task",
            task_category=None,
            estimated_minutes=60,
            start_time=today,
            completed=False,
            deadline=today,
            importance=7,
        )

        self.assertEqual(task.user, self.user)
        self.assertEqual(self.user.tasks.count(), 1)

    def test_preference_helpers(self):
        preference = Preference.objects.create(
            user=self.user,
            sleep_start=datetime.time(23, 0),
            sleep_end=datetime.time(7, 0),
            max_daily_study_time=4,
        )

        holidays = preference.getHolidaysForYear(2025)

        self.assertTrue(len(holidays) > 0)
        self.assertEqual(preference.getSleep(), "23:00:00 - 07:00:00")

    def test_maximum_study_time_can_be_24_hours(self):
        preference = Preference.objects.create(
            user=self.user,
            sleep_start=datetime.time(23, 0),
            sleep_end=datetime.time(7, 0),
            max_daily_study_time=24,
        )
        preference.full_clean()

    def test_maximum_study_time_can_be_0_hours(self):
        preference = Preference.objects.create(
            user=self.user,
            sleep_start=datetime.time(23, 0),
            sleep_end=datetime.time(7, 0),
            max_daily_study_time=0,
        )
        preference.full_clean()

    def test_maximum_study_time_cannot_be_25_hours(self):
        preference = Preference(
            user=self.user,
            sleep_start=datetime.time(23, 0),
            sleep_end=datetime.time(7, 0),
            max_daily_study_time=25,
        )

        with self.assertRaises(ValidationError):
            preference.full_clean()

    def test_maximum_study_time_cannot_be_less_than_0_hours(self):
        preference = Preference(
            user=self.user,
            sleep_start=datetime.time(23, 0),
            sleep_end=datetime.time(7, 0),
            max_daily_study_time=-1,
        )

        with self.assertRaises(ValidationError):
            preference.full_clean()


class CalendarSerializerTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="serializeruser",
            password="password123",
        )

    def test_calendar_serializer_fields(self):
        today = timezone.now().date()
        category = Category.objects.create(text="Study")
        task = Task.objects.create(
            user=self.user,
            task_message="Read notes",
            task_category=category,
            estimated_minutes=60,
            start_time=today,
            completed=False,
            deadline=today + datetime.timedelta(days=2),
            importance=4,
        )

        data = CalendarSerializer(task).data

        self.assertEqual(data["task_category"], "Study")
        self.assertEqual(
            set(data.keys()),
            {
                "id",
                "task_message",
                "task_category",
                "start_time",
                "deadline",
                "importance",
                "completed",
            },
        )


class TaskViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="viewuser",
            password="password123",
        )
        self.other_user = get_user_model().objects.create_user(
            username="otheruser",
            password="password123",
        )

    def test_task_list_filters_by_user_and_orders(self):
        today = timezone.now().date()
        Task.objects.create(
            user=self.user,
            task_message="First task",
            task_category=None,
            estimated_minutes=30,
            start_time=today + datetime.timedelta(days=1),
            completed=False,
            deadline=today + datetime.timedelta(days=10),
            importance=2,
        )
        earlier_task = Task.objects.create(
            user=self.user,
            task_message="Earlier task",
            task_category=None,
            estimated_minutes=45,
            start_time=today,
            completed=False,
            deadline=today + datetime.timedelta(days=5),
            importance=3,
        )
        Task.objects.create(
            user=self.other_user,
            task_message="Other user task",
            task_category=None,
            estimated_minutes=20,
            start_time=today,
            completed=False,
            deadline=today + datetime.timedelta(days=4),
            importance=1,
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/tasks/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["id"], earlier_task.id)

    def test_task_list_requires_authentication(self):
        response = self.client.get("/api/tasks/")

        self.assertIn(response.status_code, {401, 403})

    def test_perform_create_sets_user(self):
        viewset = TaskViewSet()
        serializer = Mock()

        viewset.request = Mock(user=self.user)
        viewset.perform_create(serializer)

        serializer.save.assert_called_once_with(user=self.user)


class UrlTests(SimpleTestCase):
    def test_tasks_url_resolves(self):
        resolver = resolve("/api/tasks/")

        self.assertEqual(resolver.func.cls, TaskViewSet)
