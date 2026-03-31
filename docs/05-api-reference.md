# 05 — API Reference

> **Related docs:** [Architecture →](./03-architecture.md) | [Data Model →](./04-data-model.md)

---

## General Conventions

### Base URL

All endpoints are prefixed with `/api/`. In production: `https://timely.subhan.work/api/`.

### Authentication

All endpoints require `Authorization: Token <knox-token>` unless explicitly marked **Public**.  
Obtain a token via `POST /api/authentication/session/` (login) or `POST /api/authentication/register/`.

### Content type

`Content-Type: application/json` for all request bodies, unless noted (file upload uses `multipart/form-data`).

### Standard response codes

| Code | Meaning |
|------|---------|
| `200` | OK — successful retrieval or update |
| `201` | Created — resource successfully created |
| `204` | No Content — successful deletion or action with no body |
| `400` | Bad Request — validation error (body contains `{field: [errors]}`) |
| `401` | Unauthorised — missing or invalid token |
| `403` | Forbidden — authenticated but insufficient permissions |
| `404` | Not Found — resource does not exist or is not owned by the user |
| `409` | Conflict — resource already exists (e.g., duplicate preference) |
| `503` | Service Unavailable — external service not configured (e.g., VAPID missing) |

---

## Authentication

### Register

```
POST /api/authentication/register/
```

**Auth:** Public

**Request body:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `username` | string | ✓ | Must be unique |
| `email` | string | ✓ | Must be unique |
| `password` | string | ✓ | — |
| `name` | string | ✓ | Stored as `Profile.name` |

**Response `201`:**

```json
{
  "token": "<knox-token>",
  "user": { "id": 1, "username": "alice", "email": "alice@example.com" }
}
```

---

### Login

```
POST /api/authentication/session/
```

**Auth:** Public

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `username` | string | ✓ |
| `password` | string | ✓ |

**Response `200`:** Same shape as Register.

---

### Logout

```
POST /api/authentication/logout/
```

**Auth:** Required  
Destroys the current token.  
**Response `204`:** No body.

---

### Logout all devices

```
POST /api/authentication/logoutall/
```

**Auth:** Required  
Destroys all tokens for the user.  
**Response `204`:** No body.

---

### Get username by ID

```
GET /api/authentication/username/{user_id}/
```

**Auth:** Public  
**Response `200`:** `{ "id": 1, "username": "alice" }`  
**Response `404`:** User not found.

---

## Tasks

Base URL: `/api/tasks/`

### List tasks

```
GET /api/tasks/
```

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `completed` | boolean | Filter by completion status |
| `categories` | int (repeated) | Filter by category IDs |
| `start_time__gte` | ISO datetime | Tasks starting on or after |
| `deadline__lte` | ISO datetime | Tasks due on or before |
| `ordering` | string | e.g. `deadline`, `-importance` |

**Response `200`:** Array of Task objects.

### Create task

```
POST /api/tasks/
```

**Request body:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | ✓ | — |
| `description` | string | — | — |
| `estimated_minutes` | integer | ✓ | — |
| `start_time` | ISO datetime | ✓ | Earliest scheduling start |
| `deadline` | ISO datetime | ✓ | Must complete by |
| `importance` | integer 1–10 | ✓ | Scheduling priority |
| `categories` | integer[] | — | Category IDs |
| `colour` | string | — | Hex colour |
| `allow_split` | boolean | — | Default `false` |
| `min_split_minutes` | integer | — | — |
| `max_split_minutes` | integer | — | — |
| `buffer_before_minutes` | integer | — | — |
| `buffer_after_minutes` | integer | — | — |
| `locked` | boolean | — | — |

**Response `201`:** Task object.

### Retrieve task

```
GET /api/tasks/{id}/
```

**Response `200`:** Task object. **`404`** if not owned by user.

### Update task

```
PATCH /api/tasks/{id}/
```

Partial update. Same fields as Create.  
**Response `200`:** Updated task object.

### Delete task

```
DELETE /api/tasks/{id}/
```

**Response `204`.**

### Save and reschedule

```
POST /api/tasks/{id}/save-and-reschedule/
```

Saves task updates and immediately re-runs the scheduler for this task.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | ISO date | Scheduling start date |

**Request body:** Same fields as Update.  
**Response `200`:** `{ "task": <task>, "schedule_results": [...] }`

---

## Events

Base URL: `/api/events/`

### List events

```
GET /api/events/
```

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | ISO date | Expand recurrences from this date |
| `end_date` | ISO date | Expand recurrences up to this date |
| `scope` | string | `single` / `all` / `this_and_following` |

Returns `ExpandedEventInstance` objects (recurring events are expanded client-side from recurrence rules). Each instance includes `is_override`, `source_event_id`, `original_start_time`.

**Response `200`:** Array of expanded event instances.

### Create event

```
POST /api/events/
```

**Request body:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | ✓ | — |
| `description` | string | — | — |
| `location` | string | — | — |
| `colour` | string | — | Hex colour |
| `start_time` | ISO datetime | ✓ | — |
| `end_time` | ISO datetime | ✓ | — |
| `categories` | integer[] | — | — |
| `recurrence_interval` | string | — | `daily` / `weekly` / `monthly` / `yearly` |
| `recurrence_end` | ISO date | — | End of series |
| `reminders` | object[] | — | `[{minutes_before, send_email, send_push}]` |

**Response `201`:** Event object with reminders.

### Update event

```
PATCH /api/events/{id}/
```

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `scope` | string | `single` / `all` / `this_and_following` — controls how recurrence edits propagate |
| `original_start_time` | ISO datetime | Required when `scope=single` |

**Response `200`:** Updated event object.

### Delete event

```
DELETE /api/events/{id}/
```

**Query parameters:** `scope`, `original_start_time` (same as Update).  
**Response `204`.**

### Revert event instance

```
POST /api/events/{id}/revert-instance/
```

Removes an override for a single recurring event occurrence, reverting it to the series default.

**Request body:** `{ "original_start_time": "<ISO datetime>" }`  
**Response `204`.**

### Server time

```
GET /api/events/server_time/
```

Returns the current server time (used for clock sync).  
**Response `200`:** `{ "server_time": "<ISO datetime>" }`

---

## Categories

Base URL: `/api/categories/`

Standard CRUD viewset. All operations scoped to the authenticated user.

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/categories/` | List all user categories |
| `POST` | `/api/categories/` | Create category (`text`, `colour`, `max_daily_study_time`) |
| `GET` | `/api/categories/{id}/` | Retrieve category |
| `PATCH` | `/api/categories/{id}/` | Partial update |
| `DELETE` | `/api/categories/{id}/` | Delete (`204`) |

---

## Assessments

Base URL: `/api/assessments/`

### List assessments

```
GET /api/assessments/
```

**Query parameters:** `completed` (boolean), `assessment_type` (string), `categories` (int[]), `ordering`.

**Response `200`:** Array of assessment objects (includes `linked_event_details`).

### Create / Update / Delete

Standard CRUD. Creating an assessment with a `linked_event` will sync the event's `start_time` to the assessment `due_date`.

| Field | Type | Required |
|-------|------|----------|
| `title` | string | ✓ |
| `assessment_type` | string | ✓ |
| `due_date` | ISO datetime | ✓ |
| `weighting_of_assessment` | integer | ✓ |
| `completed` | boolean | — |
| `notes` | string | — |
| `reminder_offset` | integer | — |
| `linked_event` | integer (event ID) | — |
| `assessment_category` | integer | — |
| `module_category` | integer | — |
| `categories` | integer[] | — |

---

## Grades

Base URL: `/api/grades/`

Standard CRUD. Fields: `name`, `category`, `score`, `total_possible`, `date_achieved`.  
Response includes computed `percentage` and `time_spent_minutes`.

---

## Preferences

Base URL: `/api/preferences/`

### Get my preferences

```
GET /api/preferences/me/
```

**Response `200`:** Preference object.

### Update my preferences

```
PATCH /api/preferences/me/
```

Partial update. Any field from the Preference model.  
**Response `200`:** Updated preference object.

---

## Friendships

Base URL: `/api/friendships/`

### List friendships

```
GET /api/friendships/
```

Returns all friendships where the authenticated user is sender or receiver. Includes `sender_name`, `receiver_name`, `sender_avatar`, `receiver_avatar`.

### Send friend request

```
POST /api/friendships/
```

**Request body:** `{ "receiver_username": "bob" }`  
**Response `201`:** Friendship object with `state: "sent"`.

### Accept

```
POST /api/friendships/{id}/accept/
```

**Response `204`.**

### Decline

```
POST /api/friendships/{id}/decline/
```

**Response `204`.**

### Delete friendship

```
DELETE /api/friendships/{id}/
```

**Response `204`.**

---

## Special Dates

Base URL: `/api/special-dates/`

Standard CRUD. Fields: `date` (ISO date), `text`.

---

## Scheduler

### Schedule tasks

```
POST /api/schedule/
```

Triggers the allocation engine for the authenticated user's incomplete, unlocked tasks.

**Request body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `start_date` | ISO date | ✓ | — | Begin searching from this date |
| `max_days_ahead` | integer | — | From preferences | Scheduling horizon |
| `allow_split` | boolean | — | `false` | Permit task splitting |
| `replace_existing` | boolean | — | `false` | Clear existing allocations first |
| `min_block_minutes` | integer | — | From preferences | Minimum slot duration |

**Response `200`:** Array of `ScheduleResult` objects:

```json
[
  {
    "task_id": 42,
    "success": true,
    "scheduled_start": "2026-01-15T09:00:00Z",
    "scheduled_end": "2026-01-15T10:30:00Z",
    "segments": [["2026-01-15T09:00:00Z", "2026-01-15T10:30:00Z"]]
  }
]
```

### Unschedule tasks

```
POST /api/unschedule/
```

Clears `allocation` field on all user tasks.  
**Response `200`:** `{ "unscheduled_count": 5 }`

---

## Statistics

### Weekly summary

```
GET /api/stats/weekly/
```

**Query parameters:** `date` (ISO date) — week containing this date (defaults to current week).

**Response `200`:**

```json
{
  "total_tasks": 12,
  "completed_tasks": 8,
  "completion_percentage": 66.7,
  "total_minutes_planned": 480,
  "daily_stats": { "Mon": {...}, "Tue": {...} },
  "importance_stats": { "high": 3, "medium": 5, "low": 4 }
}
```

---

## Data Import / Export

### Export calendar

```
GET /api/export/
```

Returns calendar data as a downloadable file (iCal or JSON format).  
**Response `200`:** File content.

### Import calendar

```
POST /api/import/
```

**Content-Type:** `multipart/form-data`  
**Request body:** `file` (iCal or JSON file upload)  
**Response `200`:** `{ "message": "Imported successfully" }`  
**Response `400`:** Parse error details.

---

## Event Sharing

### Send share

```
POST /api/share_send/
```

**Request body:** `{ "receiver_username": "bob", "event_id": 5 }`  
**Response `200`:** Success message.

### Get pending shares

```
GET /api/share_events/
```

**Response `200`:** Array of pending share objects.

### Accept/decline share

```
POST /api/share_accept/
```

**Request body:** `{ "event_id": 5, "decision": "accept" | "decline" }`  
**Response `200`:** Success message.

---

## Bulk Operations

### Delete all tasks

```
DELETE /api/delete_tasks/
```

Deletes all tasks belonging to the authenticated user.  
**Response `200`:** `{ "message": "All tasks deleted" }`

### Delete all events

```
DELETE /api/delete_events/
```

**Response `200`:** `{ "message": "All events deleted" }`

### Delete account

```
DELETE /api/delete_account/
```

Permanently deletes the authenticated user and all their data.  
**Response `200`:** `{ "message": "Account deleted" }`

---

## Profiles

### Get my profile

```
GET /api/profiles/
```

**Response `200`:** Profile object (`name`, `date_of_birth`, `slogan`, `bio`, `avatar`, `xp`, `level`).

### Update my profile

```
PATCH /api/profiles/
```

Supports `multipart/form-data` for `avatar` file upload.  
**Response `200`:** Updated profile.

### Get public profile

```
GET /api/profiles/{username}/
```

**Response `200`:** `{ "username", "name", "bio", "avatar_url", "joined_at" }`

### Leaderboard

```
GET /api/profiles/leaderboard/
```

**Response `200`:** Array of profiles ordered by `xp` descending.

---

## Notifications

Base URL: `/api/notifications/`

### List notifications

```
GET /api/notifications/
```

**Query parameters:** `is_read` (boolean), `notification_type` (string).  
**Response `200`:** Paginated notification list.

### Mark as read / unread

```
POST /api/notifications/{id}/mark_read/
POST /api/notifications/{id}/mark_unread/
```

**Response `204`.**

### Mark all as read

```
POST /api/notifications/mark_all_read/
```

**Response `204`.**

### Unread count

```
GET /api/notifications/unread_count/
```

**Response `200`:** `{ "count": 3 }`

### Delete notification

```
DELETE /api/notifications/{id}/
```

**Response `204`.**

### Delete all notifications

```
DELETE /api/notifications/delete_all/
```

**Response `204`.**

---

## Push Subscriptions

Base URL: `/api/push/`

### Get VAPID public key

```
GET /api/push/vapid_public_key/
```

**Auth:** Public  
**Response `200`:** `{ "public_key": "<vapid-public-key>" }`  
**Response `503`:** VAPID not configured.

### Subscribe

```
POST /api/push/subscribe/
```

**Request body:**

```json
{ "endpoint": "https://...", "p256dh": "...", "auth": "..." }
```

**Response `201`.**

### Unsubscribe

```
POST /api/push/unsubscribe/
```

**Request body:** `{ "endpoint": "https://..." }`  
**Response `204`.**

---

## Pomodoro

### Log session

```
POST /api/pomo/sessions/
```

**Request body:** `{ "duration_minutes": 25 }`  
**Response `201`:** Session object.

### List sessions

```
GET /api/pomo/sessions/
```

**Response `200`:** Array of session objects.

---

## Courses

Base URL: `/api/courses/`

### List courses

```
GET /api/courses/
```

**Response `200`:** Array of course objects (with enrolment status).

### Create course

```
POST /api/courses/
```

Requires teacher account. **Request body:** `{ "name", "description" }`  
**Response `201`:** Course object.

### Join by code

```
POST /api/courses/join-by-code/
```

**Request body:** `{ "code": "ABC123" }`  
**Response `200`:** Course object.

### Leave course

```
POST /api/courses/{id}/leave/
```

**Response `200`.**

### Course events

```
GET  /api/courses/{id}/events/
POST /api/courses/{id}/events/
```

GET returns all events for the course. POST creates a course event (teacher/staff only).

### Generate join code

```
POST /api/courses/{id}/join-code/
```

Teacher only.  
**Response `201`:** `{ "code": "XYZ789", "expires_at": "..." }`

### Teacher profile

```
GET  /api/teachers/me/
POST /api/teachers/create_teacher/
POST /api/teachers/unregister_teacher/
```

---

## Admin Endpoints

All admin endpoints require `IsAdminUser` (Django `is_staff=True`).

### List users

```
GET /api/admin/users/
```

**Query parameters:** `search` (username/email), `role` (`staff`/`admin`/`student`), `q`.  
**Response `200`:** Paginated user list with `id`, `username`, `email`, `is_staff`, `is_superuser`, `is_active`, `date_joined`, `last_login`.

### Audience counts

```
GET /api/admin/audience_counts/
```

**Query parameters:** `user_ids` (int[]).  
**Response `200`:** `{ "all": 500, "staff": 12, "admin": 3, "specific": 5 }`

### Send broadcast notification

```
POST /api/admin/send_notification/
```

**Request body:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | ✓ | — |
| `message` | string | ✓ | — |
| `target` | string | ✓ | `all` / `staff` / `admin` / `users` |
| `user_ids` | integer[] | — | Required when `target=users` |

**Response `202`:** `{ "broadcast_id": 7, "message": "Queued" }`

### Broadcast history

```
GET /api/admin/broadcasts/
```

**Query parameters:** `status`, `target`.  
**Response `200`:** Paginated list of broadcast job summaries.

### Broadcast detail

```
GET /api/admin/broadcasts/{broadcastId}/
```

**Response `200`:** Full broadcast job with `recipients` list.

### Broadcast status

```
GET /api/admin/broadcasts/{broadcastId}/status/
```

**Response `200`:** `{ "status": "completed", "delivered_count": 98, "failed_count": 2 }`

### Retry failed broadcast

```
POST /api/admin/broadcasts/{broadcastId}/retry_failed/
```

Creates a new `BroadcastJob` targeting only the failed recipients.  
**Response `202`:** New broadcast ID.
