# Timely

Timely is a time management platform for higher education students. It combines task planning, calendar management, assessments, grades, notifications, sharing, and focus tools in one system so users can organise academic work more effectively.

The project is designed to go beyond a basic to-do list by supporting automated scheduling, recurring events, real-time notifications, collaborative sharing features, teacher-managed courses, and analytics-oriented views for student progress.

Production deployment: [timely.subhan.work](https://timely.subhan.work/)


## Key Features

- task creation, categorisation, tracking, and bulk deletion
- automated task scheduling with configurable scheduling options
- calendar management with recurring events and event scope updates
- assessment tracking and gradebook views
- friendship, sharing, leaderboard, and profile features
- teacher-managed courses and course detail views
- in-app notifications, push notifications, and admin broadcast tools
- Pomodoro focus timer and weekly statistics
- responsive React frontend backed by a Django REST API

## Architecture

Timely uses a modular full-stack architecture:

- frontend: React 19, TypeScript, Vite, Tailwind CSS
- backend: Django 5, Django REST Framework, Knox authentication
- async and realtime: Django Channels, Redis, Celery worker, Celery beat
- data layer: SQLite for local development and PostgreSQL for deployment
- deployment: Nginx-based static hosting for the frontend and ASGI/Daphne for the backend stack

Design priorities:

- separation of concerns between UI, API, and scheduling logic
- testable backend apps split by domain (`core`, `courses`, `notifications`, `profiles`, `scheduler`, `pomo`)
- explicit API routing under `/api/`
- support for both simple local development and a fuller async notification stack

High-level system diagram:

![Timely component diagram](docs/plantuml_uml_diagram.png)

## Design Goals

Timely aims to provide:

- a single place for students to manage deadlines, tasks, and timetable information
- clear separation between user-facing workflows and backend business logic
- support for both individual productivity and collaborative academic features
- a platform that is testable, maintainable, and deployable as a real web application

## Marker Quick Start

The recommended path for examiners is the Nix flake because it installs dependencies, prepares a local SQLite database, generates local VAPID keys, and exposes consistent entrypoints.

```bash
nix run .#init
nix run .#run
```
You will then be able to access it from `http://localhost`

- Test suite: `nix run .#tests`
- Seed database only: `nix run .#seed`
- Remove seeded data: `nix run .#unseed`

If Nix is not available on your machine, use the manual Python + npm setup instead.


## Alternative local setup: Python + npm

Use this path if Nix is unavailable.

#### Prerequisites

- Python 3.12
- Node 20
- npm
- Redis if you want to run WebSockets, Celery, and scheduled notification flows locally

#### Backend setup

From the repository root:

```bash
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
python backend/manage.py migrate
```

The example environment file is at `backend/.env.example`.

For a lightweight local setup, use:

- `POSTGRES=False`
- SQLite database at the default local path
- `REDIS_URL=redis://localhost:6379/0`

#### Frontend setup

```bash
cd frontend
npm install
```

#### Running the Application

Backend:

```bash
source venv/bin/activate
python backend/manage.py runserver
```

Frontend:

```bash
cd frontend
npm run dev
```

Manual local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/`

#### Running tests

Backend tests:
```bash
cd backend
python manage.py test
```
Frontend tests:
```bash
cd frontend
npm test
```

## External Libraries and Services

This project depends on external libraries and frameworks including:

- React, React Router, TypeScript, Vite, Tailwind CSS
- Axios, Headless UI, Heroicons, Recharts, React Big Calendar, React DnD, Three.js
- Django, Django REST Framework, django-cors-headers, django-filter
- Django Channels, channels-redis, Celery, Redis
- django-rest-knox for token authentication
- drf-spectacular for API schema support
- Faker, factory-boy, coverage, Vitest, Testing Library, ESLint, Ruff

These packages are listed in `frontend/package.json` and `backend/requirements.txt`.

### Libraries

All third-party libraries used by Timely are declared in:

- `frontend/package.json`
- `backend/requirements.txt`



## Limitations and Future Work



## AI Usage Disclosure
We have used tools like ChatGPT and Github Copilot for:
- understanding Django patterns and APIs
- guidance on how to implement common functionality
- debugging and error explanation

All code was written and adapted and reviewed properly by the team.
AI has only been used for low level assistance in line with module policy.

