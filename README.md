# Timely

**Timely** is a time management system designed for students in higher education. It combines a calendar, task scheduler, course manager, assessment tracker, and social features into a single cohesive platform.

🌐 **Live deployment:** [timely.subhan.work](https://timely.subhan.work)

---

## Overview

Timely helps students plan, prioritise, and track their academic workload. Its standout feature is an automated task scheduling engine that intelligently allocates study time across a student's calendar, respecting deadlines, importance, personal availability, and per-category daily limits.

---

## Features

- **Smart scheduler** — automatic time-slot allocation for tasks based on importance, deadlines, and user preferences
- **Calendar** — full recurring-event support with per-occurrence overrides
- **Tasks** — estimated-effort tracking, split-task scheduling, completion progress
- **Assessments & Gradebook** — linked to calendar events, with weighting and completion tracking
- **Courses** — teacher-led course creation, join codes, student enrolment, and course-event propagation
- **Notifications** — real-time WebSocket alerts, browser push notifications, and event reminders
- **Leaderboard & XP** — gamification layer rewarding task completion
- **Pomodoro timer** — focus-session logging
- **Social / Sharing** — friend system, send and accept calendar events between friends
- **Import / Export** — calendar data portability
- **16 themes** — fully customisable UI colour themes

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | Django 5.2 + Django REST Framework 3.16 |
| Authentication | Knox token auth (custom `User` model) |
| Real-time | Django Channels 4 (Daphne ASGI) |
| Task queue | Celery 5 + Redis 7 |
| Database | PostgreSQL 16 (production) / SQLite (development) |
| Frontend framework | React 19 + TypeScript (strict) |
| Build tooling | Vite 7 |
| Styling | Tailwind CSS 4 |
| HTTP client | Axios |
| Containerisation | Docker + Docker Compose |
| Reverse proxy | Nginx (with Cloudflare IP filtering) |
| CI/CD | GitHub Actions → DigitalOcean Container Registry |

---

## Installation

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Python | 3.12 |
| Node.js | 20 |
| npm | 10 |
| Redis | 7 (for WebSocket + Celery in dev) |

### Manual setup

```bash
# 1. Clone the repository
git clone https://github.com/xlightningstar/It-Worked-On-My-Machine
cd It-Worked-On-My-Machine

# 2. Create and activate a Python virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 3. Install Python dependencies
pip install -r backend/requirements.txt

# 4. Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env — set SECRET_KEY at minimum; POSTGRES=False for SQLite

# 5. Apply database migrations
python backend/manage.py migrate

# 6. (Optional) Seed sample data
python backend/manage.py seed

# 7. Install frontend dependencies
cd frontend && npm install && cd ..
```

See [docs/02-installation.md](./docs/02-installation.md) for the full guide, including Docker dev/prod options and environment variable reference.

---

## Running the Application

```bash
# Start both backend and frontend dev servers (from frontend/)
cd frontend && npm run main
# Django:  http://localhost:8000
# Vite:    http://localhost:5173
```

To start them individually:

```bash
# Backend only
cd backend && python manage.py runserver

# Frontend only
cd frontend && npm run dev
```

---

## Running Tests

### Backend

```bash
cd backend

# Run all tests
python manage.py test

# Run with coverage report
coverage run manage.py test && coverage report
```

Coverage threshold: **90 %** (enforced in CI).

### Frontend

```bash
cd frontend

# Run test suite
npm test

# Run with coverage report
npm run coverage
```

Coverage threshold: **80 %** (lines, statements, branches — enforced in CI).

---

## Project Structure

```
.
├── backend/                   # Django project ("source")
│   ├── source/                # Settings, URLs, ASGI, Celery config
│   ├── core/                  # Primary app: tasks, events, categories, etc.
│   ├── authentication/        # Knox auth, custom User model
│   ├── scheduler/             # Time-slot allocation engine
│   ├── notifications/         # WebSocket, push, Celery tasks
│   ├── profiles/              # User profiles, XP, leaderboard
│   ├── admin_panel/           # Admin broadcast & user management
│   ├── courses/               # Course entities and calendar sync
│   ├── pomo/                  # Pomodoro session tracking
│   └── requirements.txt
├── frontend/                  # React 19 + Vite 7 SPA
│   ├── src/
│   │   ├── pages/             # Route-level page components
│   │   ├── components/        # Domain-grouped UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # Axios API service modules
│   │   ├── context/           # React Context providers
│   │   └── styles/themes/     # CSS variable theme files (16 themes)
│   └── tests/                 # Vitest test suite
├── docs/                      # Project documentation
├── docker-compose.yml         # Production stack
├── docker-compose.dev.yml     # Development stack
└── .github/workflows/         # CI/CD pipelines
```

---

## Access Credentials

The following accounts are available on the seeded development database and the live deployment.

| Username | Password | Role |
|----------|----------|------|
| `thomas` | `Password123` | Teacher + Superuser |
| `david` | `Password123` | Student |
| `patrick` | `Password123` | Student |

---

## Environment Variables

The following variables must be set in `backend/.env`. A template is provided at `backend/.env.example`.

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | ✅ | Django secret key |
| `DEBUG` | ✅ | `True` for development, `False` for production |
| `ALLOWED_HOSTS` | ✅ | Comma-separated hostnames |
| `POSTGRES` | ✅ | `True` to use PostgreSQL; `False` for SQLite |
| `POSTGRES_DB` | — | PostgreSQL database name |
| `POSTGRES_USER` | — | PostgreSQL user |
| `POSTGRES_PASSWORD` | — | PostgreSQL password |
| `POSTGRES_HOST` | — | PostgreSQL host |
| `REDIS_URL` | — | Redis connection string (e.g. `redis://localhost:6379/0`) |
| `CORS_ALLOWED_ORIGINS` | — | Frontend origin(s) |
| `VAPID_PUBLIC_KEY` | — | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | — | Web Push VAPID private key |
| `VAPID_ADMIN_EMAIL` | — | VAPID contact email |

See [docs/02-installation.md](./docs/02-installation.md) for the full environment variable reference.

---

## External Libraries / Reused Code

### Backend

| Library | Purpose |
|---------|---------|
| Django 5.2 | Web framework |
| Django REST Framework 3.16 | REST API layer |
| django-knox | Token authentication |
| Django Channels 4 | WebSocket / ASGI support |
| Celery 5 | Asynchronous task queue |
| channels-redis | Redis channel layer for Django Channels |
| pywebpush | Web Push notification delivery (VAPID) |
| Faker | Seed data generation |
| coverage.py | Test coverage measurement |
| Ruff | Python linting and formatting |

### Frontend

| Library | Purpose |
|---------|---------|
| React 19 | UI framework |
| TypeScript 5 | Static typing |
| Vite 7 | Build tool and dev server |
| Tailwind CSS 4 | Utility-first styling |
| React Router 7 | Client-side routing |
| Axios | HTTP client |
| react-big-calendar | Calendar view rendering |
| Moment.js | Date/time manipulation |
| Vitest | Test runner |
| React Testing Library | Component testing utilities |

---

## AI Usage Disclosure

<!-- TODO: complete before submission -->

---

## Screenshots

<!-- TODO: add screenshots before submission -->

---

## Known Limitations

<!-- TODO: complete before submission -->
