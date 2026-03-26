from datetime import datetime
import dataclasses


@dataclasses.dataclass
class TimeSlot:

    """Represents a time slot with a start and end time."""

    start: datetime
    end: datetime


@dataclasses.dataclass
class ScheduleResult:

    """Represents the result of scheduling a task."""

    task_id: int
    success: bool
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    segments: list[tuple[datetime, datetime]] | None = None
    reason: str | None = None

