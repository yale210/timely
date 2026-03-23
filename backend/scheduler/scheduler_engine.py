from __future__ import annotations
from datetime import date, datetime, time, timedelta
from typing import Iterable, List, Tuple

from django.db.models import Q
from django.utils import timezone

from core.models import Commute, Event, Preference, SpecialDates, Task
from core.services import expand_user_events
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
        task_ids: List[int] | None = None,
        include_locked_task_ids: List[int] | None = None,
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
        self.task_ids = set(task_ids or [])
        self.include_locked_task_ids = set(include_locked_task_ids or [])

        self.preference = self._get_preference()
        self.tasks = self._get_unscheduled_tasks()
        self.scheduled_tasks = self._get_scheduled_tasks()
        self.events = self._get_events()
        self.commutes = self._get_commutes()
        self.special_dates = self._get_special_dates()
        self._scheduled_blocks: List[Tuple[datetime, datetime]] = []
        self._scheduled_task_segments: List[Tuple[Task, datetime, datetime]] = []
        self._expanded_events_by_date: dict[date, list[Tuple[datetime, datetime]]] = {}

    # ----- data access -------------------------------------------------
    def _get_preference(self):
        try:
            return self.user.preference  # type: ignore[attr-defined]
        except Preference.DoesNotExist:  # type: ignore[attr-defined]
            return None

    def _get_unscheduled_tasks(self) -> List[Task]:
        queryset = Task.objects.filter(  # type: ignore[query-annotated]
            user=self.user,
            completed=False,
            allocation=[],
        )
        if self.include_locked_task_ids:
            queryset = queryset.filter(
                Q(locked=False) | Q(id__in=self.include_locked_task_ids)
            )
        else:
            queryset = queryset.filter(locked=False)
        if self.task_ids:
            queryset = queryset.filter(id__in=self.task_ids)
        return list(queryset.order_by("-importance", "deadline"))

    def _get_scheduled_tasks(self) -> List[Task]:
        return list(
            Task.objects.filter(  # type: ignore[query-annotated]
                user=self.user,
                completed=False,
            )
            .exclude(allocation=[])
            .order_by("start_time")
        )

    @staticmethod
    def _get_task_remaining_minutes(task: Task) -> int:
        return max(
            0,
            int(getattr(task, "estimated_minutes", 0) or 0)
            - int(getattr(task, "completed_minutes", 0) or 0),
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

    @staticmethod
    def _ceil_to_minute(dt: datetime) -> datetime:
        if dt.second == 0 and dt.microsecond == 0:
            return dt
        return dt.replace(second=0, microsecond=0) + timedelta(minutes=1)

    def _merge_intervals(
        self, intervals: Iterable[Tuple[datetime, datetime]]
    ) -> List[Tuple[datetime, datetime]]:
        """
        Merge overlapping intervals into a set of non-overlapping intervals.
        """

        merged: List[Tuple[datetime, datetime]] = []
        for start, end in sorted(intervals, key=lambda x: x[0]):
            if not merged or start > merged[-1][1]:
                merged.append((start, end))
            else:
                prev_start, prev_end = merged[-1]
                merged[-1] = (prev_start, max(prev_end, end))
        return merged

    @staticmethod
    def _get_task_buffer_minutes(task: Task) -> Tuple[int, int]:
        return (
            int(getattr(task, "buffer_before_minutes", 0) or 0),
            int(getattr(task, "buffer_after_minutes", 0) or 0),
        )

    def _expand_task_segment(
        self, task: Task, start: datetime, end: datetime
    ) -> Tuple[datetime, datetime]:
        buffer_before_minutes, buffer_after_minutes = self._get_task_buffer_minutes(
            task
        )
        return (
            start - timedelta(minutes=buffer_before_minutes),
            end + timedelta(minutes=buffer_after_minutes),
        )

    def _shrink_slot_for_task(
        self, task: Task, slot: Tuple[datetime, datetime]
    ) -> Tuple[datetime, datetime] | None:
        start, end = slot
        buffer_before_minutes, buffer_after_minutes = self._get_task_buffer_minutes(
            task
        )
        actual_start = start + timedelta(minutes=buffer_before_minutes)
        actual_end = end - timedelta(minutes=buffer_after_minutes)
        if actual_end <= actual_start:
            return None
        return (actual_start, actual_end)

    def _subtract_intervals(
        self,
        window: Tuple[datetime, datetime],
        occupied: List[Tuple[datetime, datetime]],
    ) -> List[Tuple[datetime, datetime]]:
        """
        Calculate free time intervals within a given window
        by subtracting occupied intervals.
        """
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
        """
        Get all occupied time slots for the target date from events,
        commutes, and scheduled tasks.
        """
        occupied: List[Tuple[datetime, datetime]] = []
        day_start = self._aware(datetime.combine(target_date, time.min))
        day_end = self._aware(datetime.combine(target_date, time.max))

        for start, end in self._get_expanded_event_slots(target_date):
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
                    occupied.append(self._expand_task_segment(task, start, end))

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
        """
        Determine the working window for a given date based on a user's preferences.

        """
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

    def _get_expanded_event_slots(
        self, target_date: date
    ) -> List[Tuple[datetime, datetime]]:
        cached = self._expanded_events_by_date.get(target_date)
        if cached is not None:
            return cached

        day_start = self._aware(datetime.combine(target_date, time.min))
        day_end = self._aware(datetime.combine(target_date, time.max))
        instances = expand_user_events(self.user, day_start, day_end)
        slots = [(instance.start_time, instance.end_time) for instance in instances]
        self._expanded_events_by_date[target_date] = slots
        return slots

    def _get_remaining_category_minutes(
        self,
        task: Task,
        target_date: date,
        current_segments: List[Tuple[datetime, datetime]] | None = None,
    ) -> int | None:
        limited_categories = [
            category
            for category in task.categories.all()
            if category.max_daily_study_time is not None
        ]
        if not limited_categories:
            return None

        day_start = self._aware(datetime.combine(target_date, time.min))
        day_end = self._aware(datetime.combine(target_date, time.max))
        limited_category_ids = {category.id for category in limited_categories}
        category_limits = {
            category.id: int(category.max_daily_study_time)
            for category in limited_categories
            if category.id is not None
        }
        minutes_used = {category_id: 0 for category_id in category_limits}

        def add_overlap(
            start: datetime,
            end: datetime,
            category_ids: set[int],
        ) -> None:
            overlap_start = max(start, day_start)
            overlap_end = min(end, day_end)
            if overlap_end <= overlap_start:
                return
            overlap_minutes = int((overlap_end - overlap_start).total_seconds() // 60)
            for category_id in category_ids & limited_category_ids:
                minutes_used[category_id] += overlap_minutes

        for scheduled_task in self.scheduled_tasks:
            scheduled_category_ids = set(
                scheduled_task.categories.values_list("id", flat=True)
            )
            if not scheduled_category_ids & limited_category_ids:
                continue
            for slot in scheduled_task.allocation or []:
                try:
                    start = self._aware(datetime.fromisoformat(slot["start"]))
                    end = self._aware(datetime.fromisoformat(slot["end"]))
                except (KeyError, ValueError, TypeError):
                    continue
                add_overlap(start, end, scheduled_category_ids)

        for scheduled_task, start, end in self._scheduled_task_segments:
            scheduled_category_ids = set(
                scheduled_task.categories.values_list("id", flat=True)
            )
            if not scheduled_category_ids & limited_category_ids:
                continue
            add_overlap(start, end, scheduled_category_ids)

        if current_segments:
            task_category_ids = set(task.categories.values_list("id", flat=True))
            for start, end in current_segments:
                add_overlap(start, end, task_category_ids)

        remaining_minutes = [
            max(0, category_limits[category_id] - minutes_used[category_id])
            for category_id in category_limits
        ]
        return min(remaining_minutes) if remaining_minutes else None

    def get_available_slots(
        self,
        target_date: date,
        min_minutes: int,
        *,
        not_before: datetime | None = None,
        not_after: datetime | None = None,
    ) -> List[Tuple[datetime, datetime]]:
        """
        Get free time slots on the target date that are at minimum min_minutes long.
        Checks the user's working window and subtracts occupied slots.
        """
        window_start, window_end = self._working_window(target_date)
        occupied = self._get_occupied_slots(target_date)
        free_slots = self._subtract_intervals((window_start, window_end), occupied)

        if not_before is not None:
            free_slots = [
                (max(start, not_before), end)
                for start, end in free_slots
                if end > not_before
            ]
        if not_after is not None:
            free_slots = [
                (start, min(end, not_after))
                for start, end in free_slots
                if start < not_after
            ]
        # Do not schedule into past time on the start date.
        if target_date == timezone.localdate():
            now = timezone.now()
            if now > window_start:
                effective_start = self._ceil_to_minute(now)
                if not_before is not None:
                    effective_start = max(effective_start, not_before)
                free_slots = self._subtract_intervals(
                    (effective_start, window_end), occupied
                )
                if not_after is not None:
                    free_slots = [
                        (start, min(end, not_after))
                        for start, end in free_slots
                        if start < not_after
                    ]
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
                            scheduled_minutes += int(
                                (overlap_end - overlap_start).total_seconds() // 60
                            )

                for _, start, end in self._scheduled_task_segments:
                    overlap_start = max(start, window_start)
                    overlap_end = min(end, window_end)
                    if overlap_end > overlap_start:
                        scheduled_minutes += int(
                            (overlap_end - overlap_start).total_seconds() // 60
                        )

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
                        trimmed_slots.append(
                            (start, start + timedelta(minutes=minutes_left))
                        )
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

    def _clip_to_task_start(
        self, slot: Tuple[datetime, datetime], task_start: datetime
    ) -> Tuple[datetime, datetime] | None:
        start, end = slot
        if end <= task_start:
            return None
        if start < task_start:
            return (task_start, end)
        return slot

    def _schedule_task_no_split(
        self,
        task: Task,
        start_date: date,
    ) -> ScheduleResult:
        task_start = self._aware(task.start_time)
        deadline = self._aware(task.deadline)
        remaining_minutes = self._get_task_remaining_minutes(task)
        if remaining_minutes <= 0:
            return ScheduleResult(
                task_id=task.id,  # type: ignore[arg-type]
                success=True,
                scheduled_start=None,
                scheduled_end=None,
                segments=[],
            )
        search_start = max(start_date, task_start.date())
        for offset in range(self.max_days_ahead + 1):
            current_date = search_start + timedelta(days=offset)
            if current_date > deadline.date():
                break
            if not self._is_day_available(current_date):
                continue
            slots = self.get_available_slots(
                current_date,
                remaining_minutes,
                not_before=task_start if current_date == task_start.date() else None,
                not_after=deadline if current_date == deadline.date() else None,
            )
            for slot in slots:
                adjusted_slot = self._shrink_slot_for_task(task, slot)
                if not adjusted_slot:
                    continue
                capped = self._clip_to_deadline(adjusted_slot, deadline)
                if not capped:
                    continue
                clipped = self._clip_to_task_start(capped, task_start)
                if not clipped:
                    continue
                start, end = clipped
                free_minutes = (end - start).total_seconds() / 60
                category_minutes_left = self._get_remaining_category_minutes(
                    task,
                    start.date(),
                )
                if (
                    category_minutes_left is not None
                    and remaining_minutes > category_minutes_left
                ):
                    continue
                if free_minutes >= remaining_minutes:
                    scheduled_end = start + timedelta(minutes=remaining_minutes)
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
        remaining = self._get_task_remaining_minutes(task)
        task_start = self._aware(task.start_time)
        deadline = self._aware(task.deadline)
        segments: List[Tuple[datetime, datetime]] = []
        if remaining <= 0:
            return ScheduleResult(
                task_id=task.id,  # type: ignore[arg-type]
                success=True,
                scheduled_start=None,
                scheduled_end=None,
                segments=[],
            )
        min_block_minutes = getattr(task, "min_split_minutes", self.min_block_minutes)
        max_block_minutes = getattr(task, "max_split_minutes", None)

        search_start = max(start_date, task_start.date())
        for offset in range(self.max_days_ahead + 1):
            if remaining <= 0:
                break
            current_date = search_start + timedelta(days=offset)
            if current_date > deadline.date():
                break
            if not self._is_day_available(current_date):
                continue

            slots = self.get_available_slots(
                current_date,
                min_block_minutes,
                not_before=task_start if current_date == task_start.date() else None,
                not_after=deadline if current_date == deadline.date() else None,
            )
            category_minutes_left = self._get_remaining_category_minutes(
                task,
                current_date,
                current_segments=segments,
            )
            if (
                category_minutes_left is not None
                and category_minutes_left < min_block_minutes
            ):
                continue
            buffer_before_minutes, buffer_after_minutes = self._get_task_buffer_minutes(
                task
            )
            day_remaining = remaining
            day_segments: List[Tuple[datetime, datetime]] = []
            day_category_minutes_left = category_minutes_left
            for slot in slots:
                adjusted_slot = self._shrink_slot_for_task(task, slot)
                if not adjusted_slot:
                    continue
                capped = self._clip_to_deadline(adjusted_slot, deadline)
                if not capped:
                    continue
                clipped = self._clip_to_task_start(capped, task_start)
                if not clipped:
                    continue
                start, end = clipped
                cursor = start
                while day_remaining > 0 and cursor < end:
                    if (
                        day_category_minutes_left is not None
                        and day_category_minutes_left < min_block_minutes
                    ):
                        break
                    free_minutes = (end - cursor).total_seconds() / 60
                    if (
                        free_minutes < min_block_minutes
                        and day_remaining > min_block_minutes
                    ):
                        break

                    chunk = min(day_remaining, free_minutes)
                    if day_category_minutes_left is not None:
                        chunk = min(chunk, day_category_minutes_left)
                    if max_block_minutes is not None:
                        chunk = min(chunk, max_block_minutes)
                    if chunk < min_block_minutes:
                        break
                    scheduled_end = cursor + timedelta(minutes=chunk)
                    day_segments.append((cursor, scheduled_end))
                    day_remaining -= chunk
                    if day_category_minutes_left is not None:
                        day_category_minutes_left -= int(chunk)
                    cursor = scheduled_end + timedelta(
                        minutes=buffer_before_minutes + buffer_after_minutes
                    )
                    if day_remaining <= 0:
                        break

            if not day_segments:
                continue

            # If this day would leave a remainder smaller than the minimum split block,
            # discard the day's tentative chunks and keep searching future days.
            if 0 < day_remaining < min_block_minutes:
                continue

            segments.extend(day_segments)
            remaining = day_remaining

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
                    self._scheduled_blocks.extend(
                        self._expand_task_segment(task, start, end)
                        for start, end in result.segments
                    )
                    self._scheduled_task_segments.extend(
                        (task, start, end) for start, end in result.segments
                    )
                else:
                    self._scheduled_blocks.append(
                        self._expand_task_segment(
                            task, result.scheduled_start, result.scheduled_end
                        )
                    )
                    self._scheduled_task_segments.append(
                        (task, result.scheduled_start, result.scheduled_end)
                    )

        return results
