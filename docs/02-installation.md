# 02 — Installation

> **Related docs:** [Overview →](./01-overview.md) | [Architecture →](./03-architecture.md) | [Deployment →](./10-deployment.md)

---

## Prerequisites

| Tool | Minimum version | Purpose |
|------|----------------|---------|
| Python | 3.12 | Backend runtime |
| Node.js | 22 | Frontend build + dev server |
| npm | 10 | Frontend package management |
| Git | — | Source control |
| Redis | 7 | WebSocket channel layer + Celery broker (optional in dev with `InMemory`) |
| PostgreSQL | 16 | Production database (SQLite used in development) |
| Docker + Compose | 24+ | Containerised dev/production stack |

---

## Option A — Manual local setup

This is the recommended approach for active backend development.

### 1. Clone and prepare

```bash
git clone https://github.com/xlightningstar/It-Worked-On-My-Machine
cd It-Worked-On-My-Machine
```

### 2. Python virtual environment

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 3. Backend environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`. The minimum viable configuration for local development:

```dotenv
SECRET_KEY=generate-a-unique-secret-key-for-this-machine
POSTGRES=False           # Use SQLite
REDIS_URL=redis://localhost:6379/0
```

Generate the key locally before starting Django:

```bash
python3 -c 'import secrets; print(secrets.token_urlsafe(50))'
```

For a full list of variables and their purpose, see [Environment Variables](#environment-variables) below.

### 4. Database setup

```bash
python backend/manage.py migrate
```

### 5. (Optional) Seed sample data

The `seed` management command creates fake users, categories, tasks, events, grades, friendships, preferences, and profiles using Faker:

```bash
python backend/manage.py seed
```

To remove all seeded data:

```bash
python backend/manage.py unseed
```

### 6. Frontend dependencies

```bash
cd frontend
npm install
```

### 7. Start development servers

From the `frontend/` directory, the `main` script starts both servers concurrently:

```bash
cd frontend
npm run main
```

- Django API: [http://localhost:8000](http://localhost:8000)
- Vite dev server: [http://localhost:5173](http://localhost:5173)

Alternatively, start them in separate terminals:

```bash
# Terminal 1
python backend/manage.py runserver

# Terminal 2
cd frontend && npm run dev
```

### Running Celery (optional, for notifications and reminders)

Real-time notifications, event reminders, and admin broadcasts require Celery. In separate terminals:

```bash
# Terminal 3 — Celery worker (processes queued tasks)
cd backend
celery -A source worker --loglevel=info

# Terminal 4 — Celery beat (dispatches scheduled tasks)
cd backend
celery -A source beat --loglevel=info
```

Without these, async tasks queue in Redis but are never executed. WebSocket notifications still work — only scheduled reminders and background delivery are affected.

> **Development ASGI server:** `npm run main` starts Uvicorn with reload enabled, so HTTP and WebSocket changes are available during development. `python manage.py runserver` remains useful for backend-only work but does not serve Channels WebSockets without Daphne installed.

---

## Option B — Docker (development)

The development Compose file uses local build contexts, SQLite, and a mounted backend source directory.

```bash
docker compose -f docker-compose.dev.yml up --build
```

Services started:

| Service | Port | Notes |
|---------|------|-------|
| backend | Internal 8000 | Django + Uvicorn, reached through Nginx |
| frontend | Host 80 | Nginx serving the compiled React app |
| redis | Internal 6379 | Channel layer + Celery broker |

> **Note:** The dev stack uses SQLite (`POSTGRES=False`) and mounts `./backend` as a volume for live code reloading.

---

## Option C — Docker (production)

See [Deployment →](./10-deployment.md) for the full production setup. In brief:

```bash
cp .env.example .env
# Replace all placeholders and set the public hostname/origin.
docker compose up -d --build
```

The one-shot `migrate` service applies migrations automatically before the API and workers start.

---

## Environment Variables

For local development, backend configuration is read from `backend/.env`; copy `backend/.env.example` as a starting point. The production Compose stack injects the root `.env`; copy the root `.env.example` on the server.

### Required variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key — must be unique and private | Generated random value |
| `DEBUG` | Enable development error pages; always `False` in production | `True` |
| `ALLOWED_HOSTS` | Comma-separated hostnames without schemes | `localhost,127.0.0.1` |
| `POSTGRES` | `True` to use PostgreSQL, `False` for SQLite | `False` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` |

### Browser and proxy security

| Variable | Description |
|----------|-------------|
| `CSRF_TRUSTED_ORIGINS` | Comma-separated full origins, including `https://` |
| `CORS_ALLOWED_ORIGINS` | Full origins allowed only when the frontend is cross-origin |
| `SECURE_SSL_REDIRECT` | Redirect HTTP to HTTPS after TLS proxying is confirmed |
| `SECURE_HSTS_SECONDS` | HSTS duration; leave `0` until HTTPS is permanent |
| `SECURE_HSTS_INCLUDE_SUBDOMAINS` | Apply HSTS to subdomains |
| `SECURE_HSTS_PRELOAD` | Opt into browser preload requirements |

### PostgreSQL (when `POSTGRES=True`)

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_HOST` | Database hostname | `localhost` |
| `POSTGRES_USER` | Database user | — |
| `POSTGRES_PASSWORD` | Database password | — |
| `POSTGRES_DB` | Database name | — |
| `POSTGRES_PORT` | Database port | `5432` |

### Push notifications (optional)

| Variable | Description |
|----------|-------------|
| `VAPID_PUBLIC_KEY` | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | VAPID private key for Web Push |
| `VAPID_ADMIN_EMAIL` | Contact email for VAPID (format: `mailto:you@example.com`) |

To generate a VAPID key pair:

```bash
cd frontend
npx web-push generate-vapid-keys
```

Push notifications are silently disabled if VAPID keys are not set.

### Feature flags

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_RECURRENCE_OVERRIDES` | Enable per-occurrence event overrides | `True` |

---

## Linting and Formatting

Before committing, run the project's linters.

### Backend (Ruff)

```bash
# Check for lint errors
ruff check backend/

# Check formatting
ruff format --check backend/

# Auto-fix formatting
ruff format backend/
```

Ruff configuration is in `ruff.toml` at the repository root. It enforces PEP 8, the Google docstring convention (excluding migrations and test files), and disallows bare `except` clauses and naive datetimes.

### Frontend (ESLint)

```bash
cd frontend
npm run lint
```

ESLint is configured with the TypeScript, React hooks, and JSDoc rule sets. Key enforced rules:

- `react-hooks/exhaustive-deps` — error (missing hook dependencies forbidden)
- `@typescript-eslint/no-explicit-any` — warning
- `jsdoc/require-jsdoc` — required on all public exports

---

## Management Commands Reference

| Command | Description |
|---------|-------------|
| `python backend/manage.py migrate` | Apply database migrations |
| `python backend/manage.py seed` | Seed database with Faker-generated sample data |
| `python backend/manage.py unseed` | Remove all seeded data |
| `python backend/manage.py sync_cal [--user <id>]` | Sync course events to user calendars |
| `python backend/manage.py collectstatic` | Collect static files (production) |
| `python backend/manage.py createsuperuser` | Create a Django admin superuser |
