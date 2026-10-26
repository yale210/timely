# 10 — Deployment

> **Related docs:** [Installation →](./02-installation.md) | [Architecture →](./03-architecture.md) | [Notifications →](./08-notifications.md)

## Production architecture

The root `docker-compose.yml` is the supported production entrypoint. It runs:

- Nginx with the compiled React app and reverse proxies for `/api/` and `/ws/`
- Uvicorn for Django HTTP and WebSocket traffic
- one Celery worker and one Celery beat scheduler
- PostgreSQL 16 and Redis 7
- a one-shot migration container that must succeed before application processes start

The stack can build images directly from this repository. A registry is optional, so it can run on any Linux host with Docker Engine and Docker Compose v2.

## Prerequisites

- A Linux server with Docker Engine and the Compose plugin
- A DNS record for the public hostname
- A TLS-terminating reverse proxy or load balancer in front of the app
- Persistent disk space for the PostgreSQL volume and the `media/` directory

Do not expose PostgreSQL, Redis, or the backend container directly. The Compose file only publishes the frontend port.

## First deployment

Clone the repository on the server, then create the production environment file:

```bash
cp .env.example .env
python3 -c 'import secrets; print(secrets.token_urlsafe(50))'
```

Edit `.env` and replace every placeholder. At minimum, set:

```dotenv
SECRET_KEY=<generated value>
ALLOWED_HOSTS=timely.example.com
CSRF_TRUSTED_ORIGINS=https://timely.example.com
POSTGRES_DB=timely
POSTGRES_USER=timely
POSTGRES_PASSWORD=<strong unique password>
```

`ALLOWED_HOSTS` values do not include a scheme. CSRF and CORS origins do include `https://`. The default deployment is same-origin, so `CORS_ALLOWED_ORIGINS` can remain empty.

Start the stack:

```bash
mkdir -p data media
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:8080/api/health/
```

The `migrate` service runs `manage.py migrate --noinput` and exits. Backend and worker services only start after it succeeds. The health endpoint returns HTTP 200 only when Django can connect to its database.

Create the first administrator after the stack is healthy:

```bash
docker compose exec backend python manage.py createsuperuser
```

## TLS and proxy settings

The bundled Nginx container serves HTTP on `127.0.0.1:8080` by default. Terminate HTTPS with a host-level proxy such as Caddy, Traefik, an ingress controller, or a cloud load balancer. For example, a minimal Caddy site is:

```caddyfile
timely.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

The outer proxy must preserve the request host, support WebSocket upgrades, and set:

```text
X-Forwarded-Proto: https
```

If a remote load balancer must reach the server directly, set `HTTP_BIND=0.0.0.0` and restrict the published port at the firewall to that load balancer's addresses.

After HTTPS is confirmed, these optional settings can be added to `.env`:

```dotenv
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=False
```

Enable HSTS only after every relevant hostname is permanently available over HTTPS. A bad HSTS configuration is cached by browsers and is difficult to reverse.

If the React frontend is hosted on a different origin, add that full origin to both `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`. This is not needed for the supplied same-origin Nginx setup.

## Registry images

For CI-built images, set these values in `.env`:

```dotenv
BACKEND_IMAGE=registry.example.com/timely/backend:<immutable tag>
FRONTEND_IMAGE=registry.example.com/timely/frontend:<immutable tag>
```

Then deploy without rebuilding:

```bash
docker compose pull
docker compose up -d --no-build
```

Use immutable release or commit tags for rollback safety instead of relying on `latest`.

## Upgrades and rollback

For a source-based deployment:

```bash
git pull --ff-only
docker compose up -d --build
```

Compose recreates the one-shot migration service and waits for it before replacing application traffic. Review migrations and take a database backup before releases containing schema changes. Application rollback does not automatically reverse a database migration.

For registry deployments, change `BACKEND_IMAGE` and `FRONTEND_IMAGE` to the previous immutable tags and run `docker compose up -d --no-build`.

## Backups

Back up both PostgreSQL and uploaded media. For example:

```bash
docker compose exec -T postgres pg_dump -U timely -d timely -Fc > timely.dump
tar -czf timely-media.tar.gz media/
```

Use the actual database user and name from `.env`. Store backups away from the application server and test restoration periodically. The `postgres_data` Docker volume is persistent, but a volume is not a backup.

## Operations

```bash
# Service state and health
docker compose ps

# Follow all logs
docker compose logs -f

# Follow one service
docker compose logs -f backend

# Re-run Django's production checks
docker compose exec backend python manage.py check --deploy
```

Only one Celery beat instance should run for a deployment. Celery workers can be scaled independently if workload grows. The local `media/` bind mount is suitable for one host; use shared/object storage before scaling the web tier across multiple hosts.

## Production checklist

- `.env` is not committed and contains unique production secrets.
- `DEBUG=False` is supplied by the production Compose stack.
- `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS` match the public hostname.
- HTTPS redirects and HSTS are enabled only after TLS is working.
- `/api/health/` returns 200 through the public proxy.
- `/ws/` successfully upgrades to a WebSocket connection.
- PostgreSQL and `media/` backups are automated and restoration is tested.
- Redis, PostgreSQL, and port 8000 are not publicly exposed.
- VAPID keys are configured if browser push notifications are required.
