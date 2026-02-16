import dataclasses
import dataclasses
import dataclasses
import dataclasses
from datetime import date, time, datetime, timedelta

from django.conf import settings
from django.utils import timezone

from core.models import Task, Event, Commute, Preference, DayOfWeek

class Scheduler:
    """Manages and schedules tasks, events, and commutes for a user."""

    def __init__(self, user):
        """Initializes the Scheduler with a user and their data.

        Args:
            user: The user object for whom to schedule tasks.
        """
        self.user = user
        self.preference = self._get_preference()
        self.tasks = self._get_unscheduled_tasks()
        self.events = self._get_events()
        self.commutes = self._get_commutes()

    def _get_preference(self):
        """Retrieves the user's scheduling preferences.

        Returns:
            The user's Preference object, or None if no preference exists.
        """
        try:
            return self.user.preference # type: ignore
        except Preference.DoesNotExist: # type: ignore
            return None

    def _get_unscheduled_tasks(self):
        """Retrieves the user's unscheduled tasks, ordered by importance and deadline.

        Returns:
            A list of Task objects that have not been scheduled yet.
        """
        return list(
            Task.objects.filter( # type: ignore
                user=self.user,
                completed=False,
                allocation=[],
            ).order_by("-importance", "deadline")
        )

    def _get_events(self):
        """Retrieves the user's events, ordered by start time.

        Returns:
            A list of Event objects for the user.
        """
        return list(
            Event.objects.filter(user=self.user).order_by("start_time") # type: ignore
        )

    def _get_commutes(self):
        """Retrieves the user's commutes.

        Returns:
            A list of Commute objects for the user.
        """
        return list(Commute.objects.filter(user=self.user)) # type: ignore

    def _is_day_available(self, target_date):
        """Checks if a given date is available for scheduling, considering the user's days off.

        Args:
            target_date (date): The date to check.

        Returns:
            bool: True if the day is available, False otherwise.
        """
        if not self.preference:
            return True

        days_off = self.preference.days_off.values_list("day", flat=True) # type: ignore
        day_of_week = target_date.weekday() + 1  # Django DayOfWeek starts from 1
        return day_of_week not in days_off

    def _get_occupied_slots(self, target_date):
        """Retrieves a list of time slots that are already occupied by events or commutes on a given date.

        Args:
            target_date (date): The date for which to retrieve occupied slots.

        Returns:
            list: A list of tuples, where each tuple represents an occupied slot with (start_time, end_time).
        """
        occupied_slots = []

        # Add events to occupied slots
        for event in self.events:
            if event.start_time.date() == target_date:
                occupied_slots.append((event.start_time, event.end_time))

        # Add commutes to occupied slots
        for commute in self.commutes:
            # Check if commute applies to the target date's day of week
            commute_days = [d.day for d in commute.day_of_week.all()]
            if target_date.weekday() + 1 in commute_days:
                start_time = timezone.make_aware(
                    datetime.combine(target_date, commute.commute_start) # type: ignore
                )
                end_time = timezone.make_aware(
                    datetime.combine(target_date, commute.commute_end) # type: ignore
                )
                occupied_slots.append((start_time, end_time))

        return occupied_slots

    def get_available_slots(self, target_date, duration):
        """Calculates the available time slots on a given date, considering user preferences, events, and commutes.

        Args:
            target_date (date): The date for which to calculate available slots.
            duration (int): The minimum duration (in minutes) required for a time slot.

        Returns:
            list: A list of tuples, where each tuple represents an available slot with (start_time, end_time).
        """
        available_slots = []
        occupied_slots = self._get_occupied_slots(target_date)

        # Define working hours based on preference or default
        if self.preference:
            sleep_start = timezone.make_aware(
                datetime.combine(target_date, self.preference.sleep_start) # type: ignore
            )
            sleep_end = timezone.make_aware(datetime.combine(target_date, self.preference.sleep_end)) # type: ignore

            # Create initial slot from sleep_end to sleep_start
            initial_slot_start = sleep_end
            initial_slot_end = sleep_start

            # If sleep_start is earlier than sleep_end (crosses midnight), adjust initial_slot_end to the next day
            if sleep_start < sleep_end:
                initial_slot_end += timedelta(days=1)

            # Ensure the initial_slot_end date matches the target_date
            initial_slot_end = timezone.make_aware(
                datetime.combine(target_date, initial_slot_end.time())
            )
            # Ensure the initial_slot_start date matches the target_date
            initial_slot_start = timezone.make_aware(
                datetime.combine(target_date, initial_slot_start.time())
            )

            available_slots.append((initial_slot_start, initial_slot_end))

        else:
            # If no preference is set, assume the entire day is available
            start_of_day = timezone.make_aware(datetime.combine(target_date, time.min))
            end_of_day = timezone.make_aware(datetime.combine(target_date, time.max))
            available_slots.append((start_of_day, end_of_day))

        # Remove occupied slots from available slots
        final_slots = []
        for start, end in available_slots:
            available_time = end - start
            if available_time.total_seconds() / 60 >= duration:
                final_slots.append((start, end))

        return final_slots

    def schedule_tasks(self, start_date, days):
        """Schedules the user's unscheduled tasks over a given number of days.

        Args:
            start_date (date): The date from which to start scheduling.
            days (int): The number of days to schedule tasks for.

        Returns:
            list: A list of ScheduleResult objects, indicating the success or failure of scheduling each task.
        """
        results = []
        current_date = start_date

        for _ in range(days):
            if self._is_day_available(current_date):
                available_slots = self.get_available_slots(current_date, 60)  # Assuming 60 minutes task duration
                if available_slots:
                    for task in self.tasks:
                        for slot_start, slot_end in available_slots:
                            scheduled_start = slot_start
                            scheduled_end = scheduled_start + timedelta(minutes=task.estimated_minutes)

                            if scheduled_end <= slot_end:
                                results.append(
                                    ScheduleResult(
                                        task_id=task.id, # type: ignore
                                        success=True, # type: ignore
                                        scheduled_start=scheduled_start, # type: ignore
                                        scheduled_end=scheduled_end, # type: ignore
                                    )
                                )
                                # Remove the scheduled task from the list
                                self.tasks.remove(task)
                                # Stop scheduling if the task is scheduled
                                break
                            else:
                                results.append(
                                    ScheduleResult(
                                        task_id=task.id, # type: ignore
                                        success=False, # type: ignore
                                        reason="No available slot in 7 days", # type: ignore
                                    )
                                )
                else:
                    for task in self.tasks:
                        results.append(
                            ScheduleResult(
                                task_id=task.id, # type: ignore
                                success=False, # type: ignore
                                reason="No available slot in 7 days", # type: ignore
                            )
                        )
            current_date += timedelta(days=1)

        return results

@dataclasses.dataclass
class TimeSlot:
    """Represents a time slot with a start and end time."""
    start: datetime
    end: datetime


@dataclasses.dataclass
class ScheduleResult:
    """Represents the result of scheduling a task, indicating success or failure.

    Attributes:
        task_id (int): The ID of the task being scheduled.
        success (bool): True if the task was successfully scheduled, False otherwise.
        scheduled_start (datetime | None): The scheduled start time if successful, None otherwise.
        scheduled_end (datetime | None): The scheduled end time if successful, None otherwise.
        reason (str | None): A reason for failure if the task could not be scheduled, None otherwise.
    """
    task_id: int
    success: bool
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    reason: str | None = None

from django.conf import settings
from django.utils import timezone

from core.models import Task, Event, Commute, Preference, DayOfWeek

class Scheduler:
    """Manages and schedules tasks, events, and commutes for a user."""

    def __init__(self, user):
        """Initializes the Scheduler with a user and their data.

        Args:
            user: The user object for whom to schedule tasks.
        """
        self.user = user
        self.preference = self._get_preference()
        self.tasks = self._get_unscheduled_tasks()
        self.events = self._get_events()
        self.commutes = self._get_commutes()

    def _get_preference(self):
        """Retrieves the user's scheduling preferences.

        Returns:
            The user's Preference object, or None if no preference exists.
        """
        try:
            return self.user.preference # type: ignore
        except Preference.DoesNotExist: # type: ignore
            return None

    def _get_unscheduled_tasks(self):
        """Retrieves the user's unscheduled tasks, ordered by importance and deadline.

        Returns:
            A list of Task objects that have not been scheduled yet.
        """
        return list(
            Task.objects.filter( # type: ignore
                user=self.user,
                completed=False,
                allocation=[],
            ).order_by("-importance", "deadline")
        )

    def _get_events(self):
        """Retrieves the user's events, ordered by start time.

        Returns:
            A list of Event objects for the user.
        """
        return list(
            Event.objects.filter(user=self.user).order_by("start_time") # type: ignore
        )

    def _get_commutes(self):
        """Retrieves the user's commutes.

        Returns:
            A list of Commute objects for the user.
        """
        return list(Commute.objects.filter(user=self.user)) # type: ignore

    def _is_day_available(self, target_date):
        """Checks if a given date is available for scheduling, considering the user's days off.

        Args:
            target_date (date): The date to check.

        Returns:
            bool: True if the day is available, False otherwise.
        """
        if not self.preference:
            return True

        days_off = self.preference.days_off.values_list("day", flat=True) # type: ignore
        day_of_week = target_date.weekday() + 1  # Django DayOfWeek starts from 1
        return day_of_week not in days_off

    def _get_occupied_slots(self, target_date):
        """Retrieves a list of time slots that are already occupied by events or commutes on a given date.

        Args:
            target_date (date): The date for which to retrieve occupied slots.

        Returns:
            list: A list of tuples, where each tuple represents an occupied slot with (start_time, end_time).
        """
        occupied_slots = []

        # Add events to occupied slots
        for event in self.events:
            if event.start_time.date() == target_date:
                occupied_slots.append((event.start_time, event.end_time))

        # Add commutes to occupied slots
        for commute in self.commutes:
            # Check if commute applies to the target date's day of week
            commute_days = [d.day for d in commute.day_of_week.all()]
            if target_date.weekday() + 1 in commute_days:
                start_time = timezone.make_aware(
                    datetime.combine(target_date, commute.commute_start)
                )
                end_time = timezone.make_aware(
                    datetime.combine(target_date, commute.commute_end)
                )
                occupied_slots.append((start_time, end_time))

        return occupied_slots

    def get_available_slots(self, target_date, duration):
        """Calculates the available time slots on a given date, considering user preferences, events, and commutes.

        Args:
            target_date (date): The date for which to calculate available slots.
            duration (int): The minimum duration (in minutes) required for a time slot.

        Returns:
            list: A list of tuples, where each tuple represents an available slot with (start_time, end_time).
        """
        available_slots = []
        occupied_slots = self._get_occupied_slots(target_date)

        # Define working hours based on preference or default
        if self.preference:
            sleep_start = timezone.make_aware(
                datetime.combine(target_date, self.preference.sleep_start) # type: ignore
            )
            sleep_end = timezone.make_aware(datetime.combine(target_date, self.preference.sleep_end)) # type: ignore

            # Create initial slot from sleep_end to sleep_start
            initial_slot_start = sleep_end
            initial_slot_end = sleep_start

            # If sleep_start is earlier than sleep_end (crosses midnight), adjust initial_slot_end to the next day
            if sleep_start < sleep_end:
                initial_slot_end += timedelta(days=1)

            # Ensure the initial_slot_end date matches the target_date
            initial_slot_end = timezone.make_aware(
                datetime.combine(target_date, initial_slot_end.time())
            )
            # Ensure the initial_slot_start date matches the target_date
            initial_slot_start = timezone.make_aware(
                datetime.combine(target_date, initial_slot_start.time())
            )

            available_slots.append((initial_slot_start, initial_slot_end))

        else:
            # If no preference is set, assume the entire day is available
            start_of_day = timezone.make_aware(datetime.combine(target_date, time.min))
            end_of_day = timezone.make_aware(datetime.combine(target_date, time.max))
            available_slots.append((start_of_day, end_of_day))

        # Remove occupied slots from available slots
        final_slots = []
        for start, end in available_slots:
            available_time = end - start
            if available_time.total_seconds() / 60 >= duration:
                final_slots.append((start, end))

        return final_slots

    def schedule_tasks(self, start_date, days):
        """Schedules the user's unscheduled tasks over a given number of days.

        Args:
            start_date (date): The date from which to start scheduling.
            days (int): The number of days to schedule tasks for.

        Returns:
            list: A list of ScheduleResult objects, indicating the success or failure of scheduling each task.
        """
        results = []
        current_date = start_date

        for _ in range(days):
            if self._is_day_available(current_date):
                available_slots = self.get_available_slots(current_date, 60)  # Assuming 60 minutes task duration
                if available_slots:
                    for task in self.tasks:
                        for slot_start, slot_end in available_slots:
                            scheduled_start = slot_start
                            scheduled_end = scheduled_start + timedelta(minutes=task.estimated_minutes)

                            if scheduled_end <= slot_end:
                                results.append(
                                    ScheduleResult(
                                        task_id=task.id, # type: ignore
                                        success=True, # type: ignore
                                        scheduled_start=scheduled_start, # type: ignore
                                        scheduled_end=scheduled_end, # type: ignore
                                    )
                                )
                                # Remove the scheduled task from the list
                                self.tasks.remove(task)
                                # Stop scheduling if the task is scheduled
                                break
                            else:
                                results.append(
                                    ScheduleResult(
                                        task_id=task.id, # type: ignore
                                        success=False, # type: ignore
                                        reason="No available slot in 7 days", # type: ignore
                                    )
                                )
                else:
                    for task in self.tasks:
                        results.append(
                            ScheduleResult(
                                task_id=task.id, # type: ignore
                                success=False, # type: ignore
                                reason="No available slot in 7 days", # type: ignore
                            )
                        )
            current_date += timedelta(days=1)

        return results

@dataclasses.dataclass
class TimeSlot:
    """Represents a time slot with a start and end time."""
    start: datetime
    end: datetime


@dataclasses.dataclass
class ScheduleResult:
    """Represents the result of scheduling a task, indicating success or failure.

    Attributes:
        task_id (int): The ID of the task being scheduled.
        success (bool): True if the task was successfully scheduled, False otherwise.
        scheduled_start (datetime | None): The scheduled start time if successful, None otherwise.
        scheduled_end (datetime | None): The scheduled end time if successful, None otherwise.
        reason (str | None): A reason for failure if the task could not be scheduled, None otherwise.
    """
    task_id: int
    success: bool
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    reason: str | None = None

from django.conf import settings
from django.utils import timezone

from core.models import Task, Event, Commute, Preference, DayOfWeek

class Scheduler:
    """Manages and schedules tasks, events, and commutes for a user."""

    def __init__(self, user):
        """Initializes the Scheduler with a user and their data.

        Args:
            user: The user object for whom to schedule tasks.
        """
        self.user = user
        self.preference = self._get_preference()
        self.tasks = self._get_unscheduled_tasks()
        self.events = self._get_events()
        self.commutes = self._get_commutes()

    def _get_preference(self):
        """Retrieves the user's scheduling preferences.

        Returns:
            The user's Preference object, or None if no preference exists.
        """
        try:
            return self.user.preference
        except Preference.DoesNotExist:
            return None

    def _get_unscheduled_tasks(self):
        """Retrieves the user's unscheduled tasks, ordered by importance and deadline.

        Returns:
            A list of Task objects that have not been scheduled yet.
        """
        return list(
            Task.objects.filter(
                user=self.user,
                completed=False,
                allocation=[],
            ).order_by("-importance", "deadline")
        )

    def _get_events(self):
        """Retrieves the user's events, ordered by start time.

        Returns:
            A list of Event objects for the user.
        """
        return list(
            Event.objects.filter(user=self.user).order_by("start_time")
        )

    def _get_commutes(self):
        """Retrieves the user's commutes.

        Returns:
            A list of Commute objects for the user.
        """
        return list(Commute.objects.filter(user=self.user))

    def _is_day_available(self, target_date):
        """Checks if a given date is available for scheduling, considering the user's days off.

        Args:
            target_date (date): The date to check.

        Returns:
            bool: True if the day is available, False otherwise.
        """
        if not self.preference:
            return True

        days_off = self.preference.days_off.values_list("day", flat=True)
        day_of_week = target_date.weekday() + 1  # Django DayOfWeek starts from 1
        return day_of_week not in days_off

    def _get_occupied_slots(self, target_date):
        """Retrieves a list of time slots that are already occupied by events or commutes on a given date.

        Args:
            target_date (date): The date for which to retrieve occupied slots.

        Returns:
            list: A list of tuples, where each tuple represents an occupied slot with (start_time, end_time).
        """
        occupied_slots = []

        # Add events to occupied slots
        for event in self.events:
            if event.start_time.date() == target_date:
                occupied_slots.append((event.start_time, event.end_time))

        # Add commutes to occupied slots
        for commute in self.commutes:
            # Check if commute applies to the target date's day of week
            commute_days = [d.day for d in commute.day_of_week.all()]
            if target_date.weekday() + 1 in commute_days:
                start_time = timezone.make_aware(
                    datetime.combine(target_date, commute.commute_start)
                )
                end_time = timezone.make_aware(
                    datetime.combine(target_date, commute.commute_end)
                )
                occupied_slots.append((start_time, end_time))

        return occupied_slots

    def get_available_slots(self, target_date, duration):
        """Calculates the available time slots on a given date, considering user preferences, events, and commutes.

        Args:
            target_date (date): The date for which to calculate available slots.
            duration (int): The minimum duration (in minutes) required for a time slot.

        Returns:
            list: A list of tuples, where each tuple represents an available slot with (start_time, end_time).
        """
        available_slots = []
        occupied_slots = self._get_occupied_slots(target_date)

        # Define working hours based on preference or default
        if self.preference:
            sleep_start = timezone.make_aware(
                datetime.combine(target_date, self.preference.sleep_start)
            )
            sleep_end = timezone.make_aware(datetime.combine(target_date, self.preference.sleep_end))

            # Create initial slot from sleep_end to sleep_start
            initial_slot_start = sleep_end
            initial_slot_end = sleep_start

            # If sleep_start is earlier than sleep_end (crosses midnight), adjust initial_slot_end to the next day
            if sleep_start < sleep_end:
                initial_slot_end += timedelta(days=1)

            # Ensure the initial_slot_end date matches the target_date
            initial_slot_end = timezone.make_aware(
                datetime.combine(target_date, initial_slot_end.time())
            )
            # Ensure the initial_slot_start date matches the target_date
            initial_slot_start = timezone.make_aware(
                datetime.combine(target_date, initial_slot_start.time())
            )

            available_slots.append((initial_slot_start, initial_slot_end))

        else:
            # If no preference is set, assume the entire day is available
            start_of_day = timezone.make_aware(datetime.combine(target_date, time.min))
            end_of_day = timezone.make_aware(datetime.combine(target_date, time.max))
            available_slots.append((start_of_day, end_of_day))

        # Remove occupied slots from available slots
        final_slots = []
        for start, end in available_slots:
            available_time = end - start
            if available_time.total_seconds() / 60 >= duration:
                final_slots.append((start, end))

        return final_slots

    def schedule_tasks(self, start_date, days):
        """Schedules the user's unscheduled tasks over a given number of days.

        Args:
            start_date (date): The date from which to start scheduling.
            days (int): The number of days to schedule tasks for.

        Returns:
            list: A list of ScheduleResult objects, indicating the success or failure of scheduling each task.
        """
        results = []
        current_date = start_date

        for _ in range(days):
            if self._is_day_available(current_date):
                available_slots = self.get_available_slots(current_date, 60)  # Assuming 60 minutes task duration
                if available_slots:
                    for task in self.tasks:
                        for slot_start, slot_end in available_slots:
                            scheduled_start = slot_start
                            scheduled_end = scheduled_start + timedelta(minutes=task.estimated_minutes)

                            if scheduled_end <= slot_end:
                                results.append(
                                    ScheduleResult(
                                        task_id=task.id,
                                        success=True,
                                        scheduled_start=scheduled_start,
                                        scheduled_end=scheduled_end,
                                    )
                                )
                                # Remove the scheduled task from the list
                                self.tasks.remove(task)
                                # Stop scheduling if the task is scheduled
                                break
                            else:
                                results.append(
                                    ScheduleResult(
                                        task_id=task.id,
                                        success=False,
                                        reason="No available slot in 7 days",
                                    )
                                )
                else:
                    for task in self.tasks:
                        results.append(
                            ScheduleResult(
                                task_id=task.id,
                                success=False,
                                reason="No available slot in 7 days",
                            )
                        )
            current_date += timedelta(days=1)

        return results

@dataclasses.dataclass
class TimeSlot:
    """Represents a time slot with a start and end time."""
    start: datetime
    end: datetime


@dataclasses.dataclass
class ScheduleResult:
    """Represents the result of scheduling a task, indicating success or failure.

    Attributes:
        task_id (int): The ID of the task being scheduled.
        success (bool): True if the task was successfully scheduled, False otherwise.
        scheduled_start (datetime | None): The scheduled start time if successful, None otherwise.
        scheduled_end (datetime | None): The scheduled end time if successful, None otherwise.
        reason (str | None): A reason for failure if the task could not be scheduled, None otherwise.
    """
    task_id: int
    success: bool
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    reason: str | None = None

from django.conf import settings
from django.utils import timezone

from core.models import Task, Event, Commute, Preference, DayOfWeek


class Scheduler:
    """Manages and schedules tasks, events, and commutes for a user."""

    def __init__(self, user):
        """Initializes the Scheduler with a user and their data.

        Args:
            user: The user object for whom to schedule tasks.
        """
        self.user = user
        self.preference = self._get_preference()
        self.tasks = self._get_unscheduled_tasks()
        self.events = self._get_events()
        self.commutes = self._get_commutes()

    def _get_preference(self):
        """Retrieves the user's scheduling preferences.

        Returns:
            The user's Preference object, or None if no preference exists.
        """
        try:
            return self.user.preference
        except Preference.DoesNotExist:
            return None

    def _get_unscheduled_tasks(self):
        """Retrieves the user's unscheduled tasks, ordered by importance and deadline.

        Returns:
            A list of Task objects that have not been scheduled yet.
        """
        return list(
            Task.objects.filter(
                user=self.user,
                completed=False,
                allocation=[],
            ).order_by("-importance", "deadline")
        )

    def _get_events(self):
        """Retrieves the user's events, ordered by start time.

        Returns:
            A list of Event objects for the user.
        """
        return list(
            Event.objects.filter(user=self.user).order_by("start_time")
        )

    def _get_commutes(self):
        """Retrieves the user's commutes.

        Returns:
            A list of Commute objects for the user.
        """
        return list(Commute.objects.filter(user=self.user))

    def _is_day_available(self, target_date):
        """Checks if a given date is available for scheduling, considering the user's days off.

        Args:
            target_date (date): The date to check.

        Returns:
            bool: True if the day is available, False otherwise.
        """
        if not self.preference:
            return True

        days_off = self.preference.days_off.values_list("day", flat=True)
        day_of_week = target_date.weekday() + 1  # Django DayOfWeek starts from 1
        return day_of_week not in days_off

    def _get_occupied_slots(self, target_date):
        """Retrieves a list of time slots that are already occupied by events or commutes on a given date.

        Args:
            target_date (date): The date for which to retrieve occupied slots.

        Returns:
            list: A list of tuples, where each tuple represents an occupied slot with (start_time, end_time).
        """
        occupied_slots = []

        # Add events to occupied slots
        for event in self.events:
            if event.start_time.date() == target_date:
                occupied_slots.append((event.start_time, event.end_time))

        # Add commutes to occupied slots
        for commute in self.commutes:
            # Check if commute applies to the target date's day of week
            commute_days = [d.day for d in commute.day_of_week.all()]
            if target_date.weekday() + 1 in commute_days:
                start_time = timezone.make_aware(
                    datetime.combine(target_date, commute.commute_start)
                )
                end_time = timezone.make_aware(
                    datetime.combine(target_date, commute.commute_end)
                )
                occupied_slots.append((start_time, end_time))

        return occupied_slots

    def get_available_slots(self, target_date, duration):
        """Calculates the available time slots on a given date, considering user preferences, events, and commutes.

        Args:
            target_date (date): The date for which to calculate available slots.
            duration (int): The minimum duration (in minutes) required for a time slot.

        Returns:
            list: A list of tuples, where each tuple represents an available slot with (start_time, end_time).
        """
        available_slots = []
        occupied_slots = self._get_occupied_slots(target_date)

        # Define working hours based on preference or default
        if self.preference:
            sleep_start = timezone.make_aware(
                datetime.combine(target_date, self.preference.sleep_start)
            )
            sleep_end = timezone.make_aware(datetime.combine(target_date, self.preference.sleep_end))

            # Create initial slot from sleep_end to sleep_start
            initial_slot_start = sleep_end
            initial_slot_end = sleep_start

            # If sleep_start is earlier than sleep_end (crosses midnight), adjust initial_slot_end to the next day
            if sleep_start < sleep_end:
                initial_slot_end += timedelta(days=1)

            # Ensure the initial_slot_end date matches the target_date
            initial_slot_end = timezone.make_aware(
                datetime.combine(target_date, initial_slot_end.time())
            )
            # Ensure the initial_slot_start date matches the target_date
            initial_slot_start = timezone.make_aware(
                datetime.combine(target_date, initial_slot_start.time())
            )

            available_slots.append((initial_slot_start, initial_slot_end))

        else:
            # If no preference is set, assume the entire day is available
            start_of_day = timezone.make_aware(datetime.combine(target_date, time.min))
            end_of_day = timezone.make_aware(datetime.combine(target_date, time.max))
            available_slots.append((start_of_day, end_of_day))

        # Remove occupied slots from available slots
        final_slots = []
        for start, end in available_slots:
            available_time = end - start
            if available_time.total_seconds() / 60 >= duration:
                final_slots.append((start, end))

        return final_slots

    def schedule_tasks(self, start_date, days):
        """Schedules the user's unscheduled tasks over a given number of days.

        Args:
            start_date (date): The date from which to start scheduling.
            days (int): The number of days to schedule tasks for.

        Returns:
            list: A list of ScheduleResult objects, indicating the success or failure of scheduling each task.
        """
        results = []
        current_date = start_date

        for _ in range(days):
            if self._is_day_available(current_date):
                available_slots = self.get_available_slots(current_date, 60)  # Assuming 60 minutes task duration
                if available_slots:
                    for task in self.tasks:
                        for slot_start, slot_end in available_slots:
                            scheduled_start = slot_start
                            scheduled_end = scheduled_start + timedelta(minutes=task.estimated_minutes)

                            if scheduled_end <= slot_end:
                                results.append(
                                    ScheduleResult(
                                        task_id=task.id,
                                        success=True,
                                        scheduled_start=scheduled_start,
                                        scheduled_end=scheduled_end,
                                    )
                                )
                                # Remove the scheduled task from the list
                                self.tasks.remove(task)
                                # Stop scheduling if the task is scheduled
                                break
                            else:
                                results.append(
                                    ScheduleResult(
                                        task_id=task.id,
                                        success=False,
                                        reason="No available slot in 7 days",
                                    )
                                )
                else:
                    for task in self.tasks:
                        results.append(
                            ScheduleResult(
                                task_id=task.id,
                                success=False,
                                reason="No available slot in 7 days",
                            )
                        )
            current_date += timedelta(days=1)

        return results


@dataclasses.dataclass
class TimeSlot:
    """Represents a time slot with a start and end time."""
    start: datetime
    end: datetime


@dataclasses.dataclass
class ScheduleResult:
    """Represents the result of scheduling a task, indicating success or failure.

    Attributes:
        task_id (int): The ID of the task being scheduled.
        success (bool): True if the task was successfully scheduled, False otherwise.
        scheduled_start (datetime | None): The scheduled start time if successful, None otherwise.
        scheduled_end (datetime | None): The scheduled end time if successful, None otherwise.
        reason (str | None): A reason for failure if the task could not be scheduled, None otherwise.
    """
    task_id: int
    success: bool
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    reason: str | None = None
    def __init__(self, user):
        self.user = user
        self.preference = self._get_preference()
        self.tasks = self._get_unscheduled_tasks()
        self.events = self._get_events()
        self.commutes = self._get_commutes()

    def _get_preference(self):
        try:
            return self.user.preference
        except Preference.DoesNotExist:
            return None

    def _get_unscheduled_tasks(self):
        return list(
            Task.objects.filter(
                user=self.user,
                completed=False,
                allocation=[],
            ).order_by("-importance", "deadline")
        )

    def _get_events(self):
        return list(
            Event.objects.filter(user=self.user).order_by("start_time")
        )

    def _get_commutes(self):
        return list(Commute.objects.filter(user=self.user))

    def _is_day_available(self, target_date):
        if not self.preference:
            return True

        days_off = self.preference.days_off.values_list("day", flat=True)
        day_of_week = target_date.weekday() + 1  # Django DayOfWeek starts from 1
        return day_of_week not in days_off

    def _get_occupied_slots(self, target_date):
        occupied_slots = []

        # Add events to occupied slots
        for event in self.events:
            if event.start_time.date() == target_date:
                occupied_slots.append((event.start_time, event.end_time))

        # Add commutes to occupied slots
        for commute in self.commutes:
            # Check if commute applies to the target date's day of week
            commute_days = [d.day for d in commute.day_of_week.all()]
            if target_date.weekday() + 1 in commute_days:
                start_time = timezone.make_aware(
                    datetime.combine(target_date, commute.commute_start)
                )
                end_time = timezone.make_aware(
                    datetime.combine(target_date, commute.commute_end)
                )
                occupied_slots.append((start_time, end_time))

        return occupied_slots

    def get_available_slots(self, target_date, duration):
        available_slots = []
        occupied_slots = self._get_occupied_slots(target_date)

        # Define working hours based on preference or default
        if self.preference:
            sleep_start = timezone.make_aware(
                datetime.combine(target_date, self.preference.sleep_start)
            )
            sleep_end = timezone.make_aware(datetime.combine(target_date, self.preference.sleep_end))

            # Create initial slot from sleep_end to sleep_start
            initial_slot_start = sleep_end
            initial_slot_end = sleep_start

            # If sleep_start is earlier than sleep_end (crosses midnight), adjust initial_slot_end to the next day
            if sleep_start < sleep_end:
                initial_slot_end += timedelta(days=1)

            # Ensure the initial_slot_end date matches the target_date
            initial_slot_end = timezone.make_aware(
                datetime.combine(target_date, initial_slot_end.time())
            )
            # Ensure the initial_slot_start date matches the target_date
            initial_slot_start = timezone.make_aware(
                datetime.combine(target_date, initial_slot_start.time())
            )

            available_slots.append((initial_slot_start, initial_slot_end))

        else:
            # If no preference is set, assume the entire day is available
            start_of_day = timezone.make_aware(datetime.combine(target_date, time.min))
            end_of_day = timezone.make_aware(datetime.combine(target_date, time.max))
            available_slots.append((start_of_day, end_of_day))

        # Remove occupied slots from available slots
        final_slots = []
        for start, end in available_slots:
            available_time = end - start
            if available_time.total_seconds() / 60 >= duration:
                final_slots.append((start, end))

        return final_slots

    def schedule_tasks(self, start_date, days):
        results = []
        current_date = start_date

        for _ in range(days):
            if self._is_day_available(current_date):
                available_slots = self.get_available_slots(current_date, 60)  # Assuming 60 minutes task duration
                if available_slots:
                    for task in self.tasks:
                        for slot_start, slot_end in available_slots:
                            scheduled_start = slot_start
                            scheduled_end = scheduled_start + timedelta(minutes=task.estimated_minutes)

                            if scheduled_end <= slot_end:
                                results.append(
                                    ScheduleResult(
                                        task_id=task.id,
                                        success=True,
                                        scheduled_start=scheduled_start,
                                        scheduled_end=scheduled_end,
                                    )
                                )
                                # Remove the scheduled task from the list
                                self.tasks.remove(task)
                                # Stop scheduling if the task is scheduled
                                break
                            else:
                                results.append(
                                    ScheduleResult(
                                        task_id=task.id,
                                        success=False,
                                        reason="No available slot in 7 days",
                                    )
                                )
                else:
                    for task in self.tasks:
                        results.append(
                            ScheduleResult(
                                task_id=task.id,
                                success=False,
                                reason="No available slot in 7 days",
                            )
                        )
            current_date += timedelta(days=1)

        return results


@dataclasses.dataclass
class TimeSlot:
    start: datetime
    end: datetime


@dataclasses.dataclass
class ScheduleResult:
    task_id: int
    success: bool
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    reason: str | None = None
