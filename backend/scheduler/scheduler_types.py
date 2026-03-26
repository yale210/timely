"""Type definitions for the scheduler application."""

from datetime import datetime
import dataclasses


@dataclasses.dataclass
class TimeSlot:
    """Represents a time slot with a start and end time.

    This class provides a simple structure for managing time ranges.
    """

    start: datetime
    end: datetime


@dataclasses.dataclass
class ScheduleResult:
    """Represents the result of scheduling a task, indicating success or failure.

    Attributes:
        task_id: The ID of the task being scheduled.
        success: True if the task was successfully scheduled, False otherwise.
        scheduled_start: The scheduled start time if successful, None otherwise.
        scheduled_end: The scheduled end time if successful, None otherwise.
        segments: A list of scheduled time segments if applicable.
        reason: A reason for failure if the task could not be scheduled, None otherwise.
    """

    task_id: int
    success: bool
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    segments: list[tuple[datetime, datetime]] | None = None
    reason: str | None = None
