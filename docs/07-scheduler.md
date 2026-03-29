# 07 — Scheduler

> **Related docs:** [Architecture →](./03-architecture.md) | [Data Model →](./04-data-model.md) | [API Reference →](./05-api-reference.md#scheduler)

---

## Overview

The Timely scheduler is a **custom synchronous time-slot allocation engine** that assigns study blocks to a user's tasks. It is entirely independent of Celery — it runs in the request/response cycle when the user (or the frontend) triggers a `POST /api/schedule/` request.

> **Important distinction:** The scheduler writes to `Task.allocation` (a JSONField). Celery in this project handles only *notification delivery*, not scheduling.

---

## Scheduling Flow

![Scheduler algorithm flowchart](./images/scheduler-flow.svg)

### High-level steps

1. **Instantiate `Scheduler`** with the user's tasks, calendar events, and preferences.
2. **Sort tasks** by priority: `−importance` descending, then `deadline` ascending (i.e., most critical tasks are allocated first).
3. **For each task**, determine whether to attempt single-block or split-block allocation.
4. **Search for slots** by iterating from `start_date` to the task deadline, computing free time on each day.
5. **Store successful segments** into an internal `_scheduled_blocks` list so subsequent tasks see already-allocated time as occupied.
6. **Bulk-update** `Task.allocation` JSONField for all processed tasks.

---

## Engine Architecture

The `Scheduler` class is assembled from four mixins:

```python
class Scheduler(
    SchedulerSchedulingMixin,      # Core iteration + slot evaluation
    SchedulerAvailabilityMixin,    # Computes free time per day
    SchedulerCategoryMixin,        # Enforces per-category daily limits
    SchedulerDataMixin,            # Loads and stores task/event data
):
    ...
```

| Mixin | File | Responsibility |
|-------|------|----------------|
| `SchedulerSchedulingMixin` | `engine/scheduling.py` | Drives main loop; slot clipping, single-block allocation |
| `_SchedulerSplitSchedulingMixin` | `engine/scheduling_split.py` | Multi-block (split) allocation logic |
| `SchedulerAvailabilityMixin` | `engine/availability.py` | Computes occupied + free slots per day |
| `SchedulerCategoryMixin` | `engine/categories.py` | Per-category study-time budget |
| `SchedulerDataMixin` | `engine/data.py` | Loads user tasks, events, preferences |

---

## Task Prioritisation

Tasks are sorted before allocation begins:

```python
sorted(tasks, key=lambda task: (-task.importance, task.deadline))
```

- **Importance** (1–10): Higher importance → allocated first.
- **Deadline**: Among equally important tasks, earlier deadlines are allocated first.
- Tasks with expired deadlines are immediately marked `success=False` with reason `"Deadline already passed"`.

---

## Availability Calculation

For each candidate date, the engine computes **free time** by starting with the user's working window and subtracting all occupied intervals.

### Working window

Determined from `Preference.day_start` and `Preference.day_end`, adjusted by `Preference.day_schedule` (which allows per-day overrides).

### Occupied intervals (subtracted from free time)

| Source | Detail |
|--------|--------|
| Calendar events | All events (including expanded recurring occurrences) overlapping the day |
| Previously scheduled tasks | Tasks already processed in this scheduling run (with their buffer times expanded) |
| Scheduled blocks | Intermediate tracking list updated after each allocation |

### Buffer expansion

Each task's occupied block is **expanded** by `buffer_before_minutes` and `buffer_after_minutes` before being treated as occupied. This prevents back-to-back blocks with no breathing room.

### Daily capacity cap

If `Preference.limit_max_hours = True`, the engine calculates total already-scheduled minutes for the day and trims the remaining free slots to `max_hours_study_per_day × 60 − already_scheduled_minutes`.

### Past-slot trimming

When scheduling for today, slots that have already passed (before `timezone.now()`) are discarded.

---

## Category Constraints

The `SchedulerCategoryMixin` enforces per-category daily study limits. If a task has categories with `max_daily_study_time` set:

- The engine tracks how many minutes have already been scheduled for each category on a given day.
- A candidate slot is rejected if allocating to it would exceed any category's daily limit.

This allows the user to cap, for example, "Mathematics" at 2 hours per day regardless of overall daily capacity.

---

## Single-Block Allocation

When `allow_split = False` on a task (or the global `allow_split` parameter is `False`):

```
1. Start from max(task.start_time, start_date)
2. For each date up to task.deadline:
   a. Check if day is available (not a day-off, within horizon)
   b. Get free slots after subtracting occupied time
   c. Apply buffer shrinkage to each slot
   d. Clip each slot to [task.start_time, task.deadline]
   e. Check category limits
   f. If slot.duration >= remaining_minutes → ALLOCATE → stop
3. If no slot found → ScheduleResult(success=False, reason="No single slot available")
```

---

## Split-Block Allocation

When both `Task.allow_split = True` and the scheduler's `allow_split` parameter is `True`:

The engine (`_SchedulerSplitSchedulingMixin`) attempts to distribute the remaining duration across multiple non-contiguous blocks, subject to:

- `Task.min_split_minutes` — minimum size of each block
- `Task.max_split_minutes` — maximum size of each block (optional)
- Per-day category limits still apply per individual segment
- Each segment must still fit within `[task.start_time, task.deadline]`

The result is a `ScheduleResult` with multiple entries in `segments`.

---

## Output Format

Scheduling results are saved to `Task.allocation` as a JSON array of segments:

```json
[
  {
    "start": "2026-01-15T09:00:00+00:00",
    "end": "2026-01-15T10:30:00+00:00"
  }
]
```

For split tasks, multiple segment objects appear in the array. The frontend reads this field to render task blocks on the calendar.

The API response from `POST /api/schedule/` returns a `ScheduleResult` list:

```json
[
  {
    "task_id": 42,
    "success": true,
    "scheduled_start": "2026-01-15T09:00:00Z",
    "scheduled_end": "2026-01-15T10:30:00Z",
    "segments": [
      ["2026-01-15T09:00:00Z", "2026-01-15T10:30:00Z"]
    ]
  },
  {
    "task_id": 43,
    "success": false,
    "reason": "No single slot available within horizon",
    "segments": []
  }
]
```

---

## API Parameters Reference

| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | ISO date | Begin searching from this date (required) |
| `max_days_ahead` | integer | Override `Preference.max_days_ahead` for this run |
| `allow_split` | boolean | Enable split-block allocation (default `false`) |
| `replace_existing` | boolean | Clear existing allocations before scheduling (default `false`) |
| `min_block_minutes` | integer | Minimum slot size to consider (overrides preference) |

---

## Timezone Handling

The scheduler operates fully in the **user's configured timezone**, activated per-request by `UserTimezoneMiddleware`. All calls to `timezone.now()` and `timezone.localdate()` within the engine return correctly localised values without any manual conversion in the algorithm code.

---

## Testing

Scheduler tests live in `backend/scheduler/tests/` and cover:

- `engine/` — unit tests for slot calculation, category limits, availability, and split allocation
- `intervals/` — unit tests for interval arithmetic utilities (`subtract_intervals`, `clamp_slots`, etc.)
- `services/` — integration tests for full scheduling runs
- `views/` — API-level tests for `POST /api/schedule/` and `POST /api/unschedule/`

See [Testing →](./09-testing.md) for how to run the test suite.
