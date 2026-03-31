# 09 — Testing

> **Related docs:** [Installation →](./02-installation.md) | [Architecture →](./03-architecture.md) | [Deployment →](./10-deployment.md)

---

## Overview

Timely maintains two separate test suites: a Django backend suite and a Vite/Vitest frontend suite. Both are enforced in CI on every pull request.

| Suite | Runner | Coverage threshold | CI workflow |
|-------|--------|--------------------|-------------|
| Backend | Django test runner + `coverage.py` | **90 %** | `test-backend.yml` |
| Frontend | Vitest | **80 %** (lines, statements, branches) | `test-frontend.yml` |

---

## Backend Tests

### Running tests

```bash
# All tests
cd backend && python manage.py test

# With coverage
cd backend && coverage run manage.py test && coverage report

# HTML report
cd backend && coverage run manage.py test && coverage html
# Open htmlcov/index.html in a browser
```

### Test layout

Every app uses a `tests/` subdirectory, further organised by layer (models, serializers, views, services, etc.).

```
backend/
├── core/tests/
│   ├── models/          # test_task.py, test_event.py, test_category.py, …
│   ├── serializers/     # test_event_serializer.py, test_category_serializer.py, …
│   ├── services/        # test_event_scope_mutations.py, test_recurrence_instances.py, …
│   ├── views/           # test_task_viewset.py, test_event_viewset.py, test_calendar_view.py, …
│   ├── seeders/         # test_seeders_foundation.py, test_seeders_events.py, …
│   ├── urls/            # test_urls.py
│   ├── utils/           # test_stats.py, test_stats_coverage.py
│   └── test_user_timezone_middleware.py
├── authentication/tests/
│   ├── models/          # test_user_model.py
│   ├── serializers/     # test_login_serializer.py, test_register_serializer.py, …
│   ├── views/           # test_login_api_view.py, test_register_view.py, …
│   └── test_authenticator.py
├── profiles/tests/
│   ├── models/          # test_profile.py
│   ├── serializers/     # test_profile_serializer.py
│   ├── signals/         # test_xp_signal.py
│   └── views/           # test_profile_view.py, test_leaderboard_view.py
├── notifications/tests/
│   ├── consumers/       # test_notification_consumer.py
│   ├── models/          # test_notification.py, test_push_subscription.py
│   ├── utils/           # test_unread_count.py, test_websocket.py
│   ├── views/           # test_notification_viewset.py, test_push_view.py, test_admin_notification.py
│   ├── test_broadcast_delivery.py
│   ├── test_notification_signals.py
│   ├── test_push_tasks.py
│   └── test_tasks.py
├── scheduler/tests/
│   ├── engine/          # test_scheduler.py, test_scheduling.py, test_scheduling_split.py,
│   │                    # test_availability.py, test_categories.py, test_data.py
│   ├── intervals/       # test_intervals.py
│   ├── serializers/     # test_schedule_request_serializer.py, test_schedule_result_serializer.py
│   ├── services/        # test_scheduler_services_basics.py, test_scheduler_services_advanced.py,
│   │                    # test_scheduler_services_constraints.py
│   ├── views/           # test_schedule_tasks_view.py, test_unschedule_tasks_view.py
│   ├── test_engine_availability_categories.py
│   └── test_engine_scheduling_mixins.py
├── courses/tests/
│   ├── management/      # test_command_sync_cal.py, test_course_event_sync_service.py
│   ├── models/          # test_course.py, test_student.py, test_teacher.py
│   ├── permissions/     # test_course_permission.py, test_teacher_permission.py
│   ├── views/           # test_courses_view.py, test_course_view_listing_crud.py, …
│   └── test_urls.py
├── admin_panel/tests/
│   ├── serializers/     # test_broadcast_job_detail_serializer.py, …
│   ├── services/        # test_broadcast_jobs.py, test_user_filters.py
│   └── views/           # test_admin_panel_viewset_view.py, test_broadcast_actions_view.py, …
├── pomo/tests/
│   ├── test_models.py
│   ├── test_serializers.py
│   └── test_views.py
└── source/tests/
    └── test_urls.py
```

### Test structure

All backend tests extend `django.test.TestCase`. Common patterns:

```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

class TaskAPITestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_task(self):
        response = self.client.post("/api/tasks/", {...})
        self.assertEqual(response.status_code, 201)
```

### Key testing notes

- **Authentication:** All protected views use `APIClient.force_authenticate()` — Knox token flow is not tested in unit tests.
- **Scoping:** All test querysets are scoped to `self.user` to verify ownership enforcement.
- **Scheduler tests:** Integration tests instantiate `Scheduler` directly and assert `ScheduleResult.segments` without going through the API.
- **WebSocket tests:** `NotificationConsumer` is tested with Django Channels' `WebsocketCommunicator`.
- **Celery tasks:** Celery tasks are tested synchronously with `CELERY_TASK_ALWAYS_EAGER = True` in the test settings.
- **Timezone:** All tests set `TIME_ZONE` in the test database to avoid environment-dependent failures.
- **CI database:** Tests run against an in-memory SQLite database (no Postgres dependency in CI).

### Coverage configuration

Coverage is configured in `.coveragerc` or via `pyproject.toml`. Migrations are excluded from coverage:

```ini
[run]
source = .
omit =
    */migrations/*
    */manage.py
    */wsgi.py
    */asgi.py
    */settings*.py
```

The 90 % threshold is enforced in `test-backend.yml`:

```yaml
- run: |
    coverage run manage.py test
    coverage report --fail-under=90
```

---

## Frontend Tests

### Running tests

```bash
cd frontend

# Run test suite once
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run coverage
# Output: coverage/index.html
```

### Test layout

```
frontend/
├── tests/
│   ├── setup.ts                      # Global test setup (mocks, jest-dom)
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginForm.test.tsx
│   │   ├── dashboard/
│   │   │   └── StatCard.test.tsx
│   │   └── notifications/
│   │       └── NotificationBell.test.tsx
│   ├── hooks/
│   │   ├── tasks/
│   │   │   └── useTaskList.test.ts
│   │   └── notifications/
│   │       └── usePushSubscription.test.ts
│   └── pages/
│       └── Dashboard.test.tsx
└── vitest.config.ts                  # (or vite.config.ts with test block)
```

### Test structure

Tests use **Vitest** with **React Testing Library**. Patterns follow RTL conventions:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { LoginForm } from "@/components/auth/LoginForm";

describe("LoginForm", () => {
  it("shows validation error when email is empty", () => {
    render(<LoginForm onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
```

### Global test setup (`tests/setup.ts`)

- Imports `@testing-library/jest-dom` matchers
- Mocks `localStorage` and `sessionStorage`
- Mocks the Web Push API (`window.PushManager`, `navigator.serviceWorker`)
- Mocks `IntersectionObserver` (used by `useReveal`)
- Resets all mocks between tests via `afterEach(() => vi.clearAllMocks())`

### API mocking

Service calls are mocked at the module level with `vi.mock`:

```tsx
vi.mock("@/services/taskService", () => ({
  getTasks: vi.fn().mockResolvedValue([]),
  createTask: vi.fn(),
}));
```

### Coverage configuration (Vitest)

Defined in `vite.config.ts`:

```ts
test: {
  coverage: {
    provider: "v8",
    thresholds: {
      lines: 80,
      branches: 80,
      statements: 80,
    },
  },
}
```

The CI step fails if any threshold is breached.

---

## CI Test Workflows

### `test-backend.yml`

Triggered on: pull requests to `main`.

Steps:
1. Check out code
2. Set up Python 3.12
3. Install dependencies (`uv pip install`)
4. Run Ruff linting (`ruff check backend && ruff format --check backend`)
5. Run Django tests with coverage (`coverage run manage.py test`)
6. Assert coverage ≥ 90 % (`coverage report --fail-under=90`)
7. Build backend Docker image (smoke test)

### `test-frontend.yml`

Triggered on: pull requests to `main`.

Steps:
1. Check out code
2. Set up Node.js
3. Install dependencies (`npm ci`)
4. Run ESLint (`npm run lint`)
5. Run Vitest with coverage (`npm test -- --coverage`)
6. Assert all thresholds pass (built into Vitest config)
7. Build frontend Docker image (smoke test — `npm run build`)

---

## Writing New Tests

### Backend checklist

- [ ] Place test in the correct app's `tests/{layer}/` subdirectory (e.g. `tests/views/`, `tests/models/`)
- [ ] Use `APIClient.force_authenticate(user=self.user)` for authenticated endpoints
- [ ] Assert HTTP status code and response body shape separately
- [ ] Test ownership: verify a second user cannot access the first user's resources (403/404)
- [ ] Use `django.utils.timezone.now()` for any datetime values in test data
- [ ] Run `coverage report` locally before pushing

### Frontend checklist

- [ ] Place test in `tests/` mirroring the `src/` path
- [ ] Use `render` + RTL queries (prefer `*ByRole` over `*ByTestId`)
- [ ] Mock all API service calls — do not make real HTTP requests
- [ ] Test user-visible behaviour, not implementation details
- [ ] Do not delete failing tests — fix them or mark as `.skip` with a tracked issue
- [ ] Run `npm run coverage` locally to confirm no threshold regressions
