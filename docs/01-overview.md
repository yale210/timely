# 01 — Overview

> **Related docs:** [Installation →](./02-installation.md) | [Architecture →](./03-architecture.md) | [API Reference →](./05-api-reference.md)

---

## What is Timely?

Timely is a web application for students in higher education that consolidates time management, academic tracking, and social scheduling into one platform. Its core differentiator is an automated scheduling engine that assigns study blocks to tasks based on deadline urgency, personal importance ratings, calendar constraints, and configurable daily limits — without requiring any manual calendar blocking from the user.

---

## Feature Set

### Task Management
- Create tasks with estimated effort (minutes), start time, deadline, and importance (1–10)
- Track completion progress against estimated duration
- Assign colour labels and per-domain categories
- Lock tasks to prevent rescheduling
- Configure buffer time before and after each task block

### Automatic Scheduler
- On-demand POST request triggers full task allocation across the user's calendar
- Sorts tasks by highest importance and earliest deadline
- Respects existing calendar events, already-scheduled tasks, and buffer gaps
- Supports optional task splitting across multiple non-contiguous time blocks
- Enforces per-category daily study-time limits and global daily hour caps
- Outputs allocation data to `Task.allocation` (JSON) for the frontend to render

### Calendar & Events
- Full CRUD for calendar events
- Recurring events with daily, weekly, monthly, and yearly intervals
- Per-occurrence overrides (change title, time, or categories for a single instance without affecting the series)
- Event reminders via email and push notification
- Import and export calendar data

### Assessments & Gradebook
- Assessment entities with type, weighting, due date, and linked calendar events
- Grade recording with score, total possible, and date achieved
- Category association for both assessments and grades

### Courses
- Teacher accounts can create courses and generate join codes
- Students join courses via code; course events propagate to enrolled students' calendars
- Staff assignment and permission management within a course
- Periodic background sync (`sync_cal` Celery task) keeps course events up to date

### Notifications
- Real-time in-app notifications via WebSocket (Django Channels)
- Browser push notifications (Web Push / VAPID)
- Event reminder notifications (Celery Beat, every 60 seconds)
- Admin broadcast system: send notifications to all users, staff, or specific individuals
- Broadcast delivery audit log with retry capability for failed sends

### Social Features
- Friend requests (send, accept, decline, remove)
- Shared events: send calendar events to friends; recipients can accept or decline

### Profiles & Gamification
- User profiles with avatar, bio, and slogan
- XP awarded on task completion; level-up every 300 XP
- Public leaderboard ranked by XP

### Pomodoro Timer
- Configurable focus sessions logged to the database
- Session history queryable via the API

### Settings & Themes
- 16 built-in visual themes (light, dark, retro, taro, bento, plum-ink, paper, signal, coral, midnight, forest-night, sea-glass, ivy, neon-noir, arctic, terminal)
- Configurable typography
- Per-user scheduling preferences (day window, max study hours, timezone, week start day)

---

## Architecture Summary

Timely follows a clean separation between a stateless REST + WebSocket backend and a single-page frontend application.

![System architecture overview](./images/architecture-overview.svg)

| Layer | Technology | Notes |
|-------|-----------|-------|
| SPA | React 19 + TypeScript | Vite 7 build, Tailwind 4 styling |
| REST API | Django 5.2 + DRF 3.16 | Knox token authentication |
| Real-time | Django Channels 4 + Daphne | Redis channel layer |
| Task queue | Celery 5 | Notification delivery only |
| Scheduler | Custom Python engine | Synchronous, no external libraries |
| Database | PostgreSQL 16 / SQLite | Postgres in production |
| Cache/broker | Redis 7 | Celery broker + WebSocket channel layer |
| Reverse proxy | Nginx | Cloudflare IP filtering in production |

For a full breakdown of all Django apps and their responsibilities, see [Architecture →](./03-architecture.md).

---

## Tech Stack at a Glance

### Backend dependencies (key)

| Package | Version | Purpose |
|---------|---------|---------|
| Django | 5.2.7 | Web framework |
| djangorestframework | 3.16.1 | REST API |
| django-rest-knox | 5.0.2 | Token authentication |
| channels[daphne] | 4.3.2 | WebSocket / ASGI |
| celery[redis] | 5.6.2 | Async task queue |
| redis | 6.4.0 | Broker + channel layer client |
| psycopg[binary,pool] | 3.3.2 | PostgreSQL adapter |
| pywebpush | — | VAPID / Web Push |
| drf-spectacular | — | OpenAPI schema generation |

### Frontend dependencies (key)

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19 | UI framework |
| typescript | 5.9 | Static typing |
| vite | 7 | Build tool + dev server |
| tailwindcss | 4 | Utility-first CSS |
| axios | — | HTTP client |
| react-big-calendar | — | Calendar view component |
| moment | — | Date/time manipulation |
