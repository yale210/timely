# Timely Development Setup (Non-Docker)

This guide explains how to run the Timely notification system locally without Docker. It covers Redis, Daphne (ASGI), Celery (worker + beat), and the frontend. Instructions include macOS, Windows, and Ubuntu.

## Quick Overview

Services you will run locally:
- **Redis**: The message broker / in-memory database. It acts as the "glue" between different parts of the backend. It stores the background task queue for Celery and handles the WebSocket channel layer data for real-time updates.
- **Django Backend**: The core application server.
  - **Development**: Use `python manage.py runserver` for features like hot-reloading and automatic setup.
  - **Production Mode**: Use `daphne` to serve the ASGI application directly.
- **Celery Worker**: This process picks up background tasks from Redis (like sending emails or processing data) and executes them. Without this, your async tasks will just sit in the queue forever.
- **Celery Beat**: A scheduler that kicks off periodic tasks (like "check for reminders every minute"). It adds tasks to the Redis queue, which the Worker then picks up and executes.
- **Frontend**: The React application powered by Vite. It runs on a separate port (usually 5173) and talks to the Django backend via API calls and WebSockets.

Key config locations in the repo:
- `backend/source/asgi.py` — Channels ASGI entry point
- `backend/source/celery.py` — Celery app
- `backend/source/settings.py` — `REDIS_URL`, `CHANNEL_LAYERS`, `CELERY_*`, `ENABLE_RECURRENCE_OVERRIDES`
- `backend/.env.example` — environment variable template

## 1) Prerequisites

- **Python 3.12** (backend)
- **Node 20** (frontend)
- **Redis** (broker + channel layer)

### macOS

```bash
# Homebrew (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Python + Node
brew install python@3.12 node@20

# Redis
brew install redis
brew services start redis

# Verify
python3 --version
node --version
redis-cli ping
```

### Ubuntu

```bash
sudo apt update && sudo apt upgrade -y

# Python 3.12
sudo apt install -y python3.12 python3.12-venv python3-pip

# Node 20 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Redis (official repo)
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt update
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify
python3 --version
node --version
redis-cli ping
```

### Windows (choose one)

**Option A: WSL2 (recommended for Redis)**

```powershell
# PowerShell (Admin)
wsl --install
```

Then inside WSL (Ubuntu):

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.12 python3.12-venv python3-pip

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
sudo apt install -y redis-server
sudo service redis-server start
```

**Option B: Windows native + Docker for Redis**

```powershell
# PowerShell
winget install Python.Python.3.12
winget install OpenJS.NodeJS.LTS

# Run Redis using Docker
docker run --name redis -p 6379:6379 -d redis
```

## 2) Backend Setup

From the repository root:

```bash
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows (PowerShell)
venv\Scripts\Activate.ps1

pip install -r backend/requirements.txt
```

Create environment variables (copy the example):

```bash
cp backend/.env.example backend/.env
```

Important variables:
- `REDIS_URL=redis://localhost:6379/0`
- `POSTGRES=False` (use SQLite for local dev)
- `ENABLE_RECURRENCE_OVERRIDES=True` (enables backend-flattened recurring instances + scoped recurring mutations)
- `VAPID_*` keys only needed if testing push notifications

Run migrations:

```bash
python backend/manage.py makemigrations
python backend/manage.py migrate
```

## 3) Start Services

Open **four terminals** (or tabs). Ensure the virtualenv is active for backend commands.

### Terminal A — Redis

**macOS / Ubuntu / WSL**

```bash
redis-server
```

**Windows native (Docker)**

```powershell
docker start redis
```

### Terminal B — Django Application

**Option 1: Standard Development (Recommended)**
Use Django's `runserver` for hot-reloading and easier debugging. It supports WebSockets automatically in this project.

```bash
cd backend
python manage.py runserver
```

**Option 2: Production Simulation (Daphne)**
Run `daphne` directly to test the ASGI entry point exactly as it runs in production. Note: this does not auto-reload code changes unless you install extra tools.

```bash
cd backend
daphne -b 0.0.0.0 -p 8000 source.asgi:application
```

### Terminal C — Celery Worker

```bash
cd backend
celery -A source worker --loglevel=info
```

### Terminal D — Celery Beat

```bash
cd backend
celery -A source beat --loglevel=info
```

## 4) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` by default.

## Notes / Troubleshooting

### Redis connection
The backend expects Redis at `REDIS_URL`. Default is `redis://localhost:6379/0`.

### When to use `daphne` vs `runserver`

- **`python manage.py runserver`**: Use this for 99% of your daily development.
  - **Pros**: Automatically reloads when you save files. Auto-detects changes. Prints helpful debug logs.
  - **WebSockets**: Django Channels wraps `runserver` to use a development version of Daphne, so WebSockets *do* work here.

- **`daphne`**: Use this to verify production readiness.
  - **Pros**: It runs the exact ASGI application object (`source.asgi:application`). If `daphne` fails to start but `runserver` works, you likely have an import error or initialization issue in `asgi.py` (like trying to import models before Django is ready).
  - **Cons**: Does not hot-reload by default.

### Celery schedules
Celery beat is required for scheduled tasks (see `CELERY_BEAT_SCHEDULE` in `backend/source/settings.py`).

### VAPID keys (push notifications)
If testing push notifications, generate keys in the frontend:

```bash
cd frontend
npx web-push generate-vapid-keys
```

Then set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_ADMIN_EMAIL` in `backend/.env`.

## Common Commands (Reference)

```bash
# Backend
python backend/manage.py runserver
daphne -b 0.0.0.0 -p 8000 source.asgi:application
celery -A source worker --loglevel=info
celery -A source beat --loglevel=info

# Frontend
npm run dev
```
