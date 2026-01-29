# AGENTS.md
Guidelines for AI coding assistants working in this Timely repository (Django backend + React/TS frontend).
Keep changes minimal, reversible, and well-tested.

## Repo Map
- `backend/`: Django 5 project `source`, app `core`, REST API at `/api/`
- `backend/core/models/`: Task, Category, Commute, Profile, Preference, SpecialDates, Event
- `backend/core/views/`: DRF viewsets (TaskViewSet), serializers in `core/serializers/`
- `frontend/`: React 19 + TypeScript + Vite + Tailwind 4
- `frontend/src/pages/`: Home, Login, Signup, CalendarPage
- `docker-compose.yml`: production; `docker-compose.dev.yml`: local development

## Tool Versions
- Python 3.12, Django 5.2, DRF 3.16
- Ruff 0.14.5 (lint/format)
- Node 20, npm, Vite 7
- TypeScript 5.9 (strict mode)
- Tailwind CSS 4.1

## Quick Start
```bash
# Backend setup
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver  # http://localhost:8000

# Frontend setup
cd frontend && npm install
npm run dev  # http://localhost:5173

# Run both (from frontend/)
npm run main
```

## Build Commands
```bash
# Frontend production build
npm run build  # tsc -b && vite build

# Docker dev stack
docker compose -f docker-compose.dev.yml up --build

# Docker production
docker compose up
```

## Lint & Format
```bash
# Backend
ruff check backend
ruff format --check backend  # check only
ruff format backend          # apply fixes

# Frontend (from frontend/)
npm run lint
```

## Tests
```bash
# Run all backend tests
cd backend && python manage.py test

# Run single test class/method
cd backend && python manage.py test core.tests.test_views.TaskViewSetTest
cd backend && python manage.py test core.tests.test_views.TaskViewSetTest.test_create_task

# Run tests by file pattern
cd backend && python manage.py test --pattern='test_*.py'

# With coverage
cd backend && coverage run manage.py test && coverage report

# Frontend tests - none configured (no vitest/jest)
```

## Database
- Default: SQLite at `backend/db.sqlite3` (when `POSTGRES=False`)
- Production: Postgres 16
- Create migrations: `python backend/manage.py makemigrations`
- Apply migrations: `python backend/manage.py migrate`

## API Endpoints
- Base: `/api/`
- Tasks: `/api/tasks/` (DRF ModelViewSet, IsAuthenticated)
- Add new viewsets in `core/views.py`, register in `source/urls.py`

## Code Style

### Python/Django
- PEP8 compliant; Ruff enforces rules
- Import order: stdlib, third-party, local (one per line)
- Use `django.utils.timezone` for datetimes (avoid naive `datetime.now()`)
- Snake_case for methods/functions (legacy camelCase exists but don't add more)
- Models: set `verbose_name`, `related_name`; use validators
- Views: use DRF permissions, scope querysets by `request.user`
- Serializers: declare explicit fields

### TypeScript/React
- Strict mode enabled; never use `any`
- Use `import type` with `verbatimModuleSyntax`
- Function components with arrow functions
- Props: explicit interfaces, avoid `React.FC`
- Hooks: follow rules-of-hooks, no conditional hooks
- Event handlers: prefix with `on` or `handle`
- Boolean props: prefix with `is`/`has`/`should`

### Formatting
- 2 spaces indentation
- Double quotes for strings
- PascalCase for components, camelCase for hooks/variables
- No default exports for utilities (named exports only)
- No Prettier; use ESLint + TypeScript

### Error Handling
- Backend: validate in serializers, raise `ValidationError` with clear messages
- Catch specific exceptions, avoid bare `except:`
- HTTP codes: 400 validation, 403 auth, 404 not found
- Use atomic transactions for multi-step DB operations

### Git & CI
- Run linters before pushing: `ruff format --check`, `ruff check`, `npm run lint`
- Include migrations with model changes in same PR
- Never commit `.env` or secrets
- CI runs: `.github/workflows/test-backend.yml`, `test-frontend.yml`

## Environment Variables
- Backend: `backend/.env` (see `.env.example`)
- Frontend: `.env` at project root with `VITE_` prefix
- Key vars: `POSTGRES`, `DEBUG`, `SECRET_KEY`, `DB_*`

## Key Dependencies
- Backend: Django, DRF, django-cors-headers, psycopg, whitenoise, Faker
- Frontend: React 19, React Router v7, Axios, Tailwind 4, Headless UI, Heroicons

## Security
- Never commit secrets (SECRET_KEY, DB credentials, tokens)
- Use environment variables for configuration
- DRF permissions required on all endpoints
- CORS configured for localhost:5173,3000

## Working Tips
- Prefer small, focused functions
- Favor early returns over deep nesting
- Remove dead code, avoid commented-out code
- Add tests for new behavior
- Update AGENTS.md when adding new commands/tools
