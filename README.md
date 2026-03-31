# Timely

Timely is a time management platform for higher education students. It combines a calendar, task scheduler, course manager, assessment tracker, notifications, sharing, and focus tools in one system so users can organise academic work more effectively.

Live deployment: [timely.subhan.work](https://timely.subhan.work)

## Team name: It Worked On My Machine

Members:
- David Dudun
- Harkaran (Mark) Bual
- Mahdi Mustafa Razzaque
- Mohammed Al-Amin
- Muhammad Subhan Afzal
- Patrick Sebastian Beckwith
- Rashid Bin Shehzad
- Thomas Richard Yale
- Tommy Hoang
- Valentino Garcia-Pianovszky

## Overview

Timely helps students plan, prioritise, and track their academic workload. Its standout feature is an automated task scheduling engine that allocates study time across a student's calendar while respecting deadlines, importance, personal availability, and per-category daily limits.

## Features

- Smart scheduler with automatic time-slot allocation for tasks
- Calendar with recurring-event support and per-occurrence overrides
- Tasks with estimated effort, split scheduling, and completion progress
- Assessments and gradebook linked to course activity
- Courses with teacher-led creation, join codes, and event propagation
- Notifications via WebSockets, browser push, and reminders
- Leaderboard, XP, and Pomodoro support for motivation and focus
- Sharing, import/export, and profile/theme personalisation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | Django 5.2 + Django REST Framework 3.16 |
| Authentication | Knox token auth |
| Real-time | Django Channels 4 (Daphne ASGI) |
| Task queue | Celery 5 + Redis 7 |
| Database | PostgreSQL 16 (production) / SQLite (development) |
| Frontend framework | React 19 + TypeScript |
| Build tooling | Vite 7 |
| Styling | Tailwind CSS 4 |
| Containerisation | Docker + Docker Compose |
| Reverse proxy | Nginx |

## Quick Start

The recommended path is the Nix flake because it installs dependencies, prepares a local SQLite database, generates local VAPID keys, and exposes consistent entrypoints.

```bash
nix run .#init
nix run .#run
```

You can then access the app at `http://localhost`.

- Test suite: `nix run .#tests`
- Seed database only: `nix run .#seed`
- Remove seeded data: `nix run .#unseed`

If Nix is not available, use the manual setup below.

## Manual Setup

### Prerequisites

| Tool | Minimum version |
|------|-----------------|
| Python | 3.12 |
| Node.js | 20 |
| npm | 10 |
| Redis | 7 (for WebSocket + Celery in dev) |

### Backend

```bash
git clone https://github.com/xlightningstar/It-Worked-On-My-Machine
cd It-Worked-On-My-Machine

python -m venv venv
source venv/bin/activate

pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
python backend/manage.py migrate
python backend/manage.py seed
```

Set `SECRET_KEY` in `backend/.env` at minimum. For SQLite-based local development, set `POSTGRES=False`.

Windows PowerShell equivalents:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
python backend/manage.py migrate
```

### Frontend

```bash
cd frontend
npm install
```

See `docs/02-installation.md` for the full guide, including Docker dev/prod options and environment variable reference.

## Running the Application

```bash
# Start both backend and frontend dev servers (from frontend/)
cd frontend && npm run main
```

Or run them separately:

```bash
# Backend only
cd backend && python manage.py runserver

# Frontend only
cd frontend && npm run dev
```

Manual local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/`

## Running Tests

### Backend

```bash
cd backend
python manage.py test
coverage run manage.py test && coverage report
```

### Frontend

```bash
cd frontend
npm test
npm run coverage
```

## Project Structure

```text
.
|- backend/                   # Django project ("source")
|- frontend/                  # React + Vite SPA
|- docs/                      # Project documentation
|- docker-compose.yml         # Production stack
|- docker-compose.dev.yml     # Development stack
`- .github/workflows/         # CI/CD pipelines
```

## Access Credentials

The following accounts are available on the seeded development database and the live deployment.

| Username | Password | Role |
|----------|----------|------|
| `thomas` | `Password123` | Teacher + Superuser |
| `david` | `Password123` | Student |
| `patrick` | `Password123` | Student |

## Environment Variables

The following variables must be set in `backend/.env`. A template is provided at `backend/.env.example`.

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Django secret key |
| `DEBUG` | Yes | `True` for development, `False` for production |
| `ALLOWED_HOSTS` | Yes | Comma-separated hostnames |
| `POSTGRES` | Yes | `True` to use PostgreSQL; `False` for SQLite |
| `POSTGRES_DB` | No | PostgreSQL database name |
| `POSTGRES_USER` | No | PostgreSQL user |
| `POSTGRES_PASSWORD` | No | PostgreSQL password |
| `POSTGRES_HOST` | No | PostgreSQL host |
| `REDIS_URL` | No | Redis connection string |
| `CORS_ALLOWED_ORIGINS` | No | Frontend origin(s) |
| `VAPID_PUBLIC_KEY` | No | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | No | Web Push VAPID private key |
| `VAPID_ADMIN_EMAIL` | No | VAPID contact email |

See `docs/02-installation.md` for the full environment variable reference.

## External Libraries and Services

Timely depends on modern web tooling across the stack, including Django, DRF, Channels, Celery, Redis, React, TypeScript, Vite, Tailwind CSS, Axios, Vitest, Ruff, and supporting libraries declared in `backend/requirements.txt` and `frontend/package.json`.

## AI Usage Disclosure

We have used tools like ChatGPT and GitHub Copilot for:
- understanding Django patterns and APIs
- guidance on how to implement common functionality
- debugging and error explanation
- generating migrations from the source code
- pull request reviewing

GitHub Copilot was used in these pull requests:
[#320](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/320), [#309](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/309), [#288](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/288), [#286](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/286), [#280](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/280), [#271](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/271), [#255](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/255), [#176](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/176), [#174](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/174), [#156](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/156), [#150](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/150), [#164](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/164), [#155](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/155), [#154](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/154), [#149](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/149), [#145](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/145), [#140](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/140), [#133](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/133), [#104](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/104), [#87](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/87), [#71](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/71), [#69](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/69), [#65](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/65), [#64](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/64), [#62](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/62), [#53](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/53), [#48](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/48), [#45](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/45), [#40](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/40), [#37](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/37), [#25](https://github.com/xlightningstar/It-Worked-On-My-Machine/pull/25)

## Known Limitations

- Push notifications require valid VAPID keys and a compatible browser environment.
- Courses and notifications do not work via the Nix setup; they require Docker for local use.
- The complete iCalendar specification is not implemented, so some valid files may fail to import.
