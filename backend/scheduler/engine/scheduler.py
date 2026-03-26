"""The main scheduler engine class."""

from scheduler.engine.availability import SchedulerAvailabilityMixin
from scheduler.engine.categories import SchedulerCategoryMixin
from scheduler.engine.data import SchedulerDataMixin
from scheduler.engine.scheduling import SchedulerSchedulingMixin


class Scheduler(
    SchedulerSchedulingMixin,
    SchedulerAvailabilityMixin,
    SchedulerCategoryMixin,
    SchedulerDataMixin,
):
    """Schedules tasks within user availability and existing calendar constraints.

    This class serves as the central engine for task allocation, combining
    scheduling logic, availability calculations, category constraints,
    and data management.
    """
