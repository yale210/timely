from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Iterable, List, Tuple

from django.utils import timezone

from core.models import Commute, Event, Preference, SpecialDates, Task
from scheduler.scheduler_types import ScheduleResult


class Scheduler:
    """Schedules tasks within user availability, respecting events, commutes, and preferences."""

    def __init__(
        self,
        user,
        *,
        max_days_ahead: int = 7,
        allow_split: bool = False,
        min_block_minutes: int = 30,
    ):
        """
        Args:
            user: Django user instance.
            max_days_ahead: How many days forward to search for time (inclusive of start day).
            allow_split: Whether tasks may be split across multiple blocks.
            min_block_minutes: Minimum block length when splitting tasks.
        """
        self.user = user
        self.max_days_ahead = max_days_ahead
        self.allow_split = allow_split
        self.min_block_minutes = min_block_minutes

        self.preference = self._get_preference()
        self.tasks = self._get_unscheduled_tasks()
        self.scheduled_tasks = self._get_scheduled_tasks()
        self.events = self._get_events()
        self.commutes = self._get_commutes()
        self.special_dates = self._get_special_dates()
        self._scheduled_blocks: List[Tuple[datetime, datetime]] = []

    # ----- data access -------------------------------------------------
    def _get_preference(self):
        try:
            return self.user.preference  # type: ignore[attr-defined]
        except Preference.DoesNotExist:  # type: ignore[attr-defined]
            return None

    def _get_unscheduled_tasks(self) -> List[Task]:
        return list(
            Task.objects.filter(  # type: ignore[query-annotated]
                user=self.user,
                completed=False,
                locked=False,
                allocation=[],
            ).order_by("-importance", "deadline")
        )

    def _get_scheduled_tasks(self) -> List[Task]:
        return list(
            Task.objects.filter(  # type: ignore[query-annotated]
                user=self.user
            )
            .exclude(allocation=[])
            .order_by("start_time")
        )

    def _get_events(self) -> List[Event]:
        return list(
            Event.objects.filter(user=self.user).order_by("start_time")  # type: ignore[query-annotated]
        )

    def _get_commutes(self) -> List[Commute]:
        return list(Commute.objects.filter(user=self.user))  # type: ignore[query-annotated]

    def _get_special_dates(self):
        return set(
            SpecialDates.objects.filter(user=self.user).values_list("date", flat=True)  # type: ignore[query-annotated]
        )

    # ----- helpers -----------------------------------------------------
    @staticmethod
    def _aware(dt: datetime) -> datetime:
        if timezone.is_naive(dt):
            return timezone.make_aware(dt)
        return dt

    def _merge_intervals(
        self, intervals: Iterable[Tuple[datetime, datetime]]
    ) -> List[Tuple[datetime, datetime]]:
        merged: List[Tuple[datetime, datetime]] = []
        for start, end in sorted(intervals, key=lambda x: x[0]):
            if not merged or start > merged[-1][1]:
                merged.append((start, end))
            else:
                prev_start, prev_end = merged[-1]
                merged[-1] = (prev_start, max(prev_end, end))
        return merged

    def _subtract_intervals(
        self,
        window: Tuple[datetime, datetime],
        occupied: List[Tuple[datetime, datetime]],
    ) -> List[Tuple[datetime, datetime]]:
        start, end = window
        free: List[Tuple[datetime, datetime]] = []
        cursor = start

        for occ_start, occ_end in self._merge_intervals(occupied):
            if occ_end <= cursor or occ_start >= end:
                continue
            if occ_start > cursor:
                free.append((cursor, min(occ_start, end)))
            cursor = max(cursor, occ_end)
            if cursor >= end:
                break

        if cursor < end:
            free.append((cursor, end))
        return free

    def _is_day_available(self, target_date: date) -> bool:
        if self.preference:
            days_off = set(
                self.preference.days_off.values_list("day", flat=True)  # type: ignore[attr-defined]
            )
            if target_date.weekday() + 1 in days_off:
                return False
        if target_date in self.special_dates:
            return False
        return True

    def _get_occupied_slots(self, target_date: date) -> List[Tuple[datetime, datetime]]:
        occupied: List[Tuple[datetime, datetime]] = []
        day_start = self._aware(datetime.combine(target_date, time.min))
        day_end = self._aware(datetime.combine(target_date, time.max))

        for event in self.events:
            start = self._aware(event.start_time)
            end = self._aware(event.end_time)
            if start < day_end and end > day_start:
                occupied.append((start, end))

        for task in self.scheduled_tasks:
            for slot in task.allocation or []:
                try:
                    start = self._aware(datetime.fromisoformat(slot["start"]))
                    end = self._aware(datetime.fromisoformat(slot["end"]))
                except (KeyError, ValueError, TypeError):
                    continue
                if start < day_end and end > day_start:
                    occupied.append((start, end))

        for start, end in self._scheduled_blocks:
            if start < day_end and end > day_start:
                occupied.append((start, end))

        for commute in self.commutes:
            applies_today = True
            day_attr = getattr(commute, "day_of_week", None)
            if day_attr and hasattr(day_attr, "all"):
                commute_days = [d.day for d in day_attr.all()]
                applies_today = (target_date.weekday() + 1) in commute_days
            if applies_today:
                start_time = self._aware(
                    datetime.combine(target_date, commute.commute_start)
                )
                end_time = self._aware(
                    datetime.combine(target_date, commute.commute_end)
                )
                occupied.append((start_time, end_time))

        return occupied

    def _working_window(self, target_date: date) -> Tuple[datetime, datetime]:
        if self.preference:
            start_time, end_time = self.preference.get_day_window(target_date)  # type: ignore[attr-defined]
            day_start = self._aware(datetime.combine(target_date, start_time))
            day_end = self._aware(datetime.combine(target_date, end_time))
            if day_end <= day_start:  # crosses midnight
                day_end += timedelta(days=1)
            return day_start, day_end

        start_of_day = self._aware(datetime.combine(target_date, time.min))
        end_of_day = self._aware(datetime.combine(target_date, time.max))
        return start_of_day, end_of_day

    def get_available_slots(
        self, target_date: date, min_minutes: int
    ) -> List[Tuple[datetime, datetime]]:
        window_start, window_end = self._working_window(target_date)
        occupied = self._get_occupied_slots(target_date)
        free_slots = self._subtract_intervals((window_start, window_end), occupied)
        # Do not schedule into past time on the start date.
        if target_date == timezone.localdate():
            now = timezone.now()
            if now > window_start:
                window_start = now
                free_slots = self._subtract_intervals(
                    (window_start, window_end), occupied
                )
        if self.preference:
            max_minutes = int(self.preference.max_hours_study_per_day) * 60  # type: ignore[attr-defined]
            if max_minutes >= 0 and getattr(self.preference, "limit_max_hours", True):
                scheduled_minutes = 0
                for task in self.scheduled_tasks:
                    for slot in task.allocation or []:
                        try:
                            start = self._aware(datetime.fromisoformat(slot["start"]))
                            end = self._aware(datetime.fromisoformat(slot["end"]))
                        except (KeyError, ValueError, TypeError):
                            continue
                        overlap_start = max(start, window_start)
                        overlap_end = min(end, window_end)
                        if overlap_end > overlap_start:
                            scheduled_minutes += int((overlap_end - overlap_start).total_seconds() // 60)

                for start, end in self._scheduled_blocks:
                    overlap_start = max(start, window_start)
                    overlap_end = min(end, window_end)
                    if overlap_end > overlap_start:
                        scheduled_minutes += int((overlap_end - overlap_start).total_seconds() // 60)

                remaining_minutes = max(0, max_minutes - scheduled_minutes)
                if remaining_minutes == 0:
                    return []

                trimmed_slots: List[Tuple[datetime, datetime]] = []
                minutes_left = remaining_minutes
                for start, end in free_slots:
                    if minutes_left <= 0:
                        break
                    slot_minutes = int((end - start).total_seconds() // 60)
                    if slot_minutes <= minutes_left:
                        trimmed_slots.append((start, end))
                        minutes_left -= slot_minutes
                    else:
                        trimmed_slots.append((start, start + timedelta(minutes=minutes_left)))
                        minutes_left = 0
                        break
                free_slots = trimmed_slots

        return [
            (start, end)
            for start, end in free_slots
            if (end - start).total_seconds() / 60 >= min_minutes
        ]

    # ----- scheduling --------------------------------------------------
    def _clip_to_deadline(
        self, slot: Tuple[datetime, datetime], deadline: datetime
    ) -> Tuple[datetime, datetime] | None:
        start, end = slot
        if end <= deadline:
            return slot
        if start >= deadline:
            return None
        return (start, deadline)

    def _schedule_task_no_split(
        self,
        task: Task,
        start_date: date,
    ) -> ScheduleResult:
        deadline = self._aware(task.deadline)
        for offset in range(self.max_days_ahead):
            current_date = start_date + timedelta(days=offset)
            if current_date > deadline.date():
                break
            if not self._is_day_available(current_date):
                continue
            slots = self.get_available_slots(current_date, task.estimated_minutes)
            for slot in slots:
                capped = self._clip_to_deadline(slot, deadline)
                if not capped:
                    continue
                start, end = capped
                free_minutes = (end - start).total_seconds() / 60
                if free_minutes >= task.estimated_minutes:
                    scheduled_end = start + timedelta(minutes=task.estimated_minutes)
                    return ScheduleResult(
                        task_id=task.id,  # type: ignore[arg-type]
                        success=True,
                        scheduled_start=start,
                        scheduled_end=scheduled_end,
                        segments=[(start, scheduled_end)],
                    )
        return ScheduleResult(
            task_id=task.id,  # type: ignore[arg-type]
            success=False,
            reason="No single slot available within horizon",
            segments=[],
        )

    def _schedule_task_split(
        self,
        task: Task,
        start_date: date,
    ) -> ScheduleResult:
        remaining = task.estimated_minutes
        deadline = self._aware(task.deadline)
        segments: List[Tuple[datetime, datetime]] = []

        for offset in range(self.max_days_ahead):
            if remaining <= 0:
                break
            current_date = start_date + timedelta(days=offset)
            if current_date > deadline.date():
                break
            if not self._is_day_available(current_date):
                continue

            slots = self.get_available_slots(current_date, self.min_block_minutes)
            for slot in slots:
                capped = self._clip_to_deadline(slot, deadline)
                if not capped:
                    continue
                start, end = capped
                cursor = start
                while remaining > 0 and cursor < end:
                    free_minutes = (end - cursor).total_seconds() / 60
                    if (
                        free_minutes < self.min_block_minutes
                        and remaining > self.min_block_minutes
                    ):
                        break

                    chunk = min(remaining, free_minutes)
                    if (
                        chunk < self.min_block_minutes
                        and remaining > self.min_block_minutes
                    ):
                        break
                    if (
                        chunk < self.min_block_minutes
                        and remaining <= self.min_block_minutes
                    ):
                        # last small piece fits
                        pass
                    scheduled_end = cursor + timedelta(minutes=chunk)
                    segments.append((cursor, scheduled_end))
                    remaining -= chunk
                    cursor = scheduled_end
                    if remaining <= 0:
                        break

        if remaining <= 0 and segments:
            return ScheduleResult(
                task_id=task.id,  # type: ignore[arg-type]
                success=True,
                scheduled_start=segments[0][0],
                scheduled_end=segments[-1][1],
                segments=segments,
            )

        return ScheduleResult(
            task_id=task.id,  # type: ignore[arg-type]
            success=False,
            reason="Insufficient time within horizon",
            segments=[],
        )

    def schedule_tasks(self, start_date: date) -> List[ScheduleResult]:
        """Attempt to schedule tasks starting from start_date up to max_days_ahead."""
        results: List[ScheduleResult] = []
        # Higher importance first, earlier deadlines next
        tasks = sorted(self.tasks, key=lambda t: (-t.importance, t.deadline))

        for task in tasks:
            deadline = self._aware(task.deadline)
            if deadline.date() < start_date:
                results.append(
                    ScheduleResult(
                        task_id=task.id,  # type: ignore[arg-type]
                        success=False,
                        reason="Deadline already passed",
                    )
                )
                continue

            if self.allow_split and task.allow_split:
                result = self._schedule_task_split(task, start_date)
            else:
                result = self._schedule_task_no_split(task, start_date)
            results.append(result)
            if (
                result.success
                and result.scheduled_start is not None
                and result.scheduled_end is not None
            ):
                if result.segments:
                    self._scheduled_blocks.extend(result.segments)
                else:
                    self._scheduled_blocks.append(
                        (result.scheduled_start, result.scheduled_end)
                    )

        return results
