# AGENTS.md
For agentic coding assistants working in this repo; keep changes small and reversible.
Repository: Timely - Django backend + React/Vite/TS frontend, Dockerized.
No Cursor rules (.cursor/rules, .cursorrules) present.
No Copilot instructions (.github/copilot-instructions.md) present.

## Repo Map
- backend/: Django 5 project `source`, app `core`, API at /api/.
- backend/core/models/: Task, Category, Commute, Profile, Preference, SpecialDates, Event.
- backend/core/views/: DRF viewsets (TaskViewSet); serializers in core/serializers/.
- backend/source/: settings, urls, asgi, wsgi.
- frontend/: React 19 + TS + Vite + Tailwind 4; entry src/main.tsx, routes in src/App.tsx.
- frontend/src/pages/: Home, Login, Signup, CalendarPage.
- docker-compose.yml: production images from registry; docker-compose.dev.yml builds locally.
- .github/workflows/: lint/test backend and frontend; build/push images to DOCR.

## Tooling Versions
- Python 3.12 in CI.
- Django 5.2, DRF 3.16.
- Ruff 0.14.5 for lint/format.
- Node 20 in CI; npm; Vite 7.
- TypeScript ~5.9 strict mode.
- ESLint flat config (@eslint/js, tseslint, react, react-hooks, react-refresh).
- Tailwind CSS 4.1 (new @import "tailwindcss" entry).
- Postgres 16 in production compose; SQLite for local when POSTGRES=False.

## Environment & Secrets
- Backend env via `backend/.env` (sample: backend/.env.example).
- POSTGRES toggled by POSTGRES=True/False; defaults DEBUG=True, SQLite path env DB_PATH.
- Never commit real secrets (SECRET_KEY, DB credentials, tokens).
- Frontend uses Vite env (`.env` at project root) with `VITE_` prefix if added; none tracked.
- Docker compose expects .env at repo root for DB; prod compose mounts ./data for sqlite.

## Install Dependencies
- Backend: `python -m venv venv && source venv/bin/activate`.
- Backend deps: `pip install -r backend/requirements.txt`.
- Frontend: `npm ci` (CI) or `npm install` in `frontend/`.
- Optional: install Ruff globally `pip install ruff`.
- Docker: `docker compose -f docker-compose.dev.yml build` builds dev images.

## Running Services Locally
- Backend dev server (SQLite): `python backend/manage.py runserver` (honors DEBUG).
- Backend dev server (Postgres): set POSTGRES=True and connection env, then run manage.py.
- Frontend dev: from frontend, `npm run dev` (Vite, default port 5173).
- Full stack (from frontend): `npm run main` spawns Django server + Vite via concurrently.
- Vite preview: `npm run preview` after build.
- Docker dev stack: `docker compose -f docker-compose.dev.yml up --build` (backend DEBUG=True).

## Build Commands
- Frontend production build: `npm run build` (tsc -b + vite build).
- Backend collectstatic not configured; static served via WhiteNoise; gunicorn command in Dockerfile.
- Docker production images built in CI as registry.digitalocean.com/segmajor/backend/frontend.

## Lint & Format
- Backend lint: `ruff check backend` (CI uses root/ruff).
- Backend format check: `ruff format --check backend`; format with `ruff format backend`.
- Frontend lint: from frontend, `npm run lint` (ESLint flat).
- No Prettier configured; favor ESLint + TypeScript for style.
- CI workflows: `.github/workflows/test-backend.yml` and `test-frontend.yml` run these commands.

## Tests
- Backend tests: `cd backend && python manage.py test`.
- Run with coverage manually: `coverage run manage.py test && coverage report` (coverage dep present).
- Frontend tests are not defined (no vitest/jest setup).
- CI runs backend tests only after lint; frontend has lint-only workflow.

## Run a Single Test
- Django dotted path works: `python backend/manage.py test core.tests.test_module.TestClass.test_method`.
- Limit by file: `python backend/manage.py test core.tests.test_module`.
- Add `--pattern` to match filenames if needed, e.g., `--pattern='test_*.py'`.
- Keep tests DB-isolated; prefer factories/Faker; cleanup via TestCase transaction.

## Database & Migrations
- Default DB SQLite at backend/db.sqlite3 unless POSTGRES=True.
- Migrations live in backend/core/migrations; create via `python backend/manage.py makemigrations`.
- Apply via `python backend/manage.py migrate`.
- When POSTGRES=True, ensure env variables all set or settings will raise ImproperlyConfigured.
- Seed data not provided; create via fixtures or admin.

## API Surface (Current)
- Router in backend/source/urls.py exposes `/api/tasks/` DRF ModelViewSet with IsAuthenticated.
- Task serializer exposes id, task_message, task_category (string), start_time, deadline, importance, completed.
- Extend endpoints by adding viewsets in core/views and registering in urls with DefaultRouter.

## Docker Notes
- Prod compose pulls images and depends_on Postgres; backend env from .env mounted to gunicorn.
- Dev compose builds from Dockerfile in backend/frontend; backend uses DEBUG=True and SQLite at /data/db.sqlite3.
- Container ports: frontend maps 80:80 in dev; backend listens 8000 internally.
- Prune images after deploy as in build workflow; avoid breaking registry tags.

## Git & CI Expectations
- Branch protection assumed on main; PRs trigger lint/test workflows per path filters.
- Keep changes minimal; avoid rebasing forced; do not amend unless asked.
- Follow repo README pre-commit advice: run `ruff format --check`, `ruff check`, `npm run lint`.
- CI Node cache uses frontend/package-lock.json; prefer npm over yarn/pnpm.

## General Code Style
- Prefer clear, small functions; keep responsibilities narrow.
- Write docstrings for non-trivial Django views/serializers/services.
- Keep file encodings ASCII/UTF-8 without BOM; Unix newlines.
- Use dependency injection/environment variables instead of constants for secrets.
- Favor early returns over deep nesting; keep cyclomatic complexity low.
- Avoid commented-out code; remove dead code promptly.
- Log sparingly; in Django use standard logging, not print, for long-running tasks.

## Python/Django Style
- Follow PEP8; line length 88-100 ok; Ruff enforces common rules.
- Imports: stdlib, third-party, local; one import per line; prefer absolute imports from core.*.
- Use datetimes/date from django.utils.timezone; avoid naive datetime.now.
- Models: verbose_name/related_name set; validators defined (MinValueValidator etc.).
- Methods should be snake_case (existing calculateTimeLeft is legacy; prefer snake_case going forward).
- Views: use DRF permissions; keep queryset scoping by request.user; avoid `.all()` without filters.
- Serializers: declare explicit fields; use StringRelatedField only when safe and read-only.
- Settings: honor DEBUG and POSTGRES flags; use ImproperlyConfigured for missing secrets.
- Admin/urls: prefer router registration via DefaultRouter; keep path prefixes stable under /api/.
- Tests: extend django.test.TestCase; use reverse() for URLs; assert response.status_code; use fixtures/factories.

## Error Handling (Backend)
- Validate request data in serializers; raise `serializers.ValidationError` with clear messages.
- In views, avoid bare except; catch specific exceptions and re-raise DRF errors.
- Return consistent HTTP codes; 400 for validation, 403 for auth, 404 for not found.
- Do not swallow DB errors; prefer atomic transactions for multi-step writes.
- When using external services, wrap in retry-safe helpers and timeouts (none present now).

## TypeScript/React Style
- TypeScript strict is on; fix all type errors rather than using `any`.
- Use `import type` with `verbatimModuleSyntax`; keep value imports separate from types.
- Prefer function components with arrow functions; avoid default export unless file primary component.
- Routing via react-router-dom v7; use `<Routes>` and element props; keep path strings centralized.
- Hooks: follow rules-of-hooks; place custom hooks in `src/hooks` if added; avoid conditional hooks.
- State: prefer local `useState`/`useReducer`; avoid heavy global state unless needed.
- Data fetching: axios available; wrap async calls in try/catch; memoize handlers when passing deeply.
- Use StrictMode-friendly patterns; avoid side effects in render; cleanup subscriptions in useEffect.
- Avoid mutating props/state; create new arrays/objects; prefer spread syntax.
- Keep components small; break down pages in `src/pages` into smaller components under `src/components` when added.

## Formatting & Naming (Frontend)
- Indentation 2 spaces; semicolons per ESLint defaults; double quotes currently used in codebase.
- Component names PascalCase; hooks camelCase starting with use; files matching exported component names.
- Props/state types: prefer explicit interfaces/types; avoid `React.FC` unless children needed.
- Event handlers prefixed with on/handle; boolean props prefixed with is/has/should.
- Avoid default exports for shared utilities; named exports aid tree-shaking.
- Keep imports ordered: react first, third-party next, internal relative last; no unused imports (ESLint no-unused).
- Avoid mixing CSS frameworks; Tailwind + minimal custom CSS in index.css already loaded.

## Styling & UI
- Tailwind 4 via `@import "tailwindcss"`; utility-first classes preferred in JSX.
- Global font set to Inter in `src/index.css`; keep typography consistent.
- Hide scrollbars already set; avoid overriding unless necessary.
- For new styles, prefer Tailwind theme tokens; avoid inline styles unless dynamic.
- Keep responsive layouts by using flex/grid utilities; test at 320px and desktop widths.
- For assets, place in frontend/public; reference via `/filename` or import as needed.

## HTTP & Data Handling
- API base currently unspecified; front-end should target backend /api endpoints (ensure CORS origins allow localhost:5173,3000).
- Include credentials only if session auth is in use; currently only permission class is IsAuthenticated.
- Serialize dates as ISO strings; ensure timezone awareness when constructing Date objects.
- When adding new endpoints, update router registrations and permissions; add serializer tests.

## Dependency Management
- Keep package-lock.json and requirements.txt in sync with installs; do not switch package manager.
- For new Python deps, pin versions; run `pip freeze > requirements.txt` if adding.
- For Node deps, prefer `npm install <pkg>`; CI caches npm using package-lock.
- Remove unused deps rather than leaving bloat; check for security advisories before adding.

## Working Safely
- Run linters before pushing; CI will block on failures.
- Keep migrations in the same PR as model changes.
- Never commit .env or credentials; use .gitignore already present.
- Document new commands in this file when adding tooling.
- If unsure about behavior, add small tests rather than manual verification.

## Contact Points
- No formal maintainers listed; infer intent from existing code and workflows.
- Keep PRs focused; include short summary and testing notes.
