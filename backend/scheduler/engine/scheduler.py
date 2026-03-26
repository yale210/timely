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
    """Schedules tasks within user availability and existing constraints."""
