from datetime import datetime
import dataclasses


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
    segments: list[tuple[datetime, datetime]] | None = None
    reason: str | None = None
