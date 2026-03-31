# 06 — Frontend

> **Related docs:** [Overview →](./01-overview.md) | [API Reference →](./05-api-reference.md) | [Installation →](./02-installation.md)

---

## Technology Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.9 (strict) | Static typing |
| Vite | 7 | Build tool and dev server |
| Tailwind CSS | 4 | Utility-first styling |
| React Router | 7 | Client-side routing |
| Axios | — | HTTP client |
| react-big-calendar | — | Calendar view rendering |
| Moment.js | — | Date/time manipulation |
| Vitest | — | Test runner |
| React Testing Library | — | Component testing |

---

## Project Structure

```
frontend/src/
├── App.tsx                   # Root component with all route definitions
├── main.tsx                  # React entry point — mounts providers
├── pages/                    # Route-level page components
│   ├── Home.tsx
│   ├── Dashboard.tsx
│   ├── Calendar.tsx
│   ├── TaskList.tsx
│   ├── Assessments.tsx
│   ├── Gradebook.tsx
│   ├── Leaderboard.tsx
│   ├── Pomodoro.tsx
│   ├── Profile.tsx
│   ├── Sharing.tsx
│   ├── Settings.tsx
│   ├── NotFound.tsx
│   ├── Authentication/       # Login.tsx, Signup.tsx, Logout.tsx
│   ├── Course/               # Course.tsx, CourseDetail.tsx, CourseManagement.tsx, CourseCreate.tsx
│   ├── Notification/         # Notifications.tsx, NotificationDetail.tsx
│   └── Admin/Notifications/  # AdminNotifications.tsx, AdminNotificationHistory.tsx, …
├── components/               # Domain-grouped UI components
│   ├── auth/
│   ├── categories/
│   ├── dashboard/
│   ├── events/
│   ├── gradebook/
│   ├── home/
│   ├── layout/
│   ├── modals/
│   ├── notifications/
│   ├── settings/
│   └── about/
├── hooks/                    # Custom React hooks (domain-grouped)
├── services/                 # Axios API service modules
├── api/                      # Notification-specific API (separate from services/)
├── context/                  # React Context providers
│   ├── PomodoroContext.tsx
│   └── NotificationContext.tsx
├── styles/
│   └── themes/               # 16 CSS theme files
└── types/                    # Shared TypeScript types (if present)
```

---

## Routing

All routes are defined in `App.tsx`. The application uses React Router v7.

![Frontend routing diagram](./images/frontend-routing.svg)

### Route guards

| Guard component | Behaviour |
|----------------|-----------|
| `RequireAuth` | Redirects unauthenticated users to `/login` |
| `RequireAdmin` | Redirects non-admin users (checks `is_staff`) |
| `RequireTeacher` | Redirects non-teacher users |
| `RedirectAuth` | Redirects already-authenticated users away from `/login` and `/` |

### Route table

| Path | Component | Guard |
|------|-----------|-------|
| `/` | `Home` | `RedirectAuth` |
| `/login` | `Login` | `RedirectAuth` |
| `/signup` | `Signup` | `RedirectAuth` |
| `/logout` | `Logout` | — |
| `/about` | `About` | — |
| `/dashboard` | `Dashboard` | `RequireAuth` |
| `/calendar` | `CalendarPage` | `RequireAuth` |
| `/tasks` | `TaskList` | `RequireAuth` |
| `/assessments` | `Assessments` | `RequireAuth` |
| `/gradebook` | `Gradebook` | `RequireAuth` |
| `/friends` | `Friends` | `RequireAuth` |
| `/sharing` | `Sharing` | `RequireAuth` |
| `/leaderboard` | `Leaderboard` | `RequireAuth` |
| `/pomodoro` | `Pomodoro` | `RequireAuth` |
| `/profiles/:username` | `ProfilePage` | `RequireAuth` |
| `/notifications` | `Notifications` | `RequireAuth` |
| `/notifications/:id` | `NotificationDetail` | `RequireAuth` |
| `/settings` | `Settings` | `RequireAuth` |
| `/courses` | `Courses` | `RequireAuth` |
| `/courses/:id` | `CourseDetail` | `RequireAuth` |
| `/courses/manage` | `CourseManagement` | `RequireAuth` + `RequireTeacher` |
| `/course/create` | `CourseCreate` | `RequireAuth` |
| `/admin/notifications` | `AdminNotifications` | `RequireAdmin` |
| `/admin/notifications/history` | `AdminNotificationHistory` | `RequireAdmin` |
| `/admin/notifications/history/:id` | `AdminNotificationHistoryDetail` | `RequireAdmin` |
| `*` | `NotFound` | — |

---

## Component Reference

Components are organised by domain. Each module exports named components with explicit prop interfaces.

### `auth/`

| Component | Props | Description |
|-----------|-------|-------------|
| `LoginForm` | `LoginFormProps` | Email/password form with submit handler |
| `SignupForm` | `SignupFormProps` | Registration form |
| `LogoutMessage` | — | Confirmation message on logout |
| `RedirectAuth` | `{ children }` | Redirects authenticated users to dashboard |
| `RequireAuth` | `{ children }` | Guards authenticated routes |
| `RequireAdmin` | `{ children }` | Guards admin routes (`is_staff` check) |

### `categories/`

| Component | Props | Description |
|-----------|-------|-------------|
| `CategoryMultiSelect` | `CategoryMultiSelectProps` | Multi-select dropdown for assigning categories |
| `CategoryColourPicker` | `CategoryColourPickerProps` | Colour picker for category creation/edit |

### `dashboard/`

| Component | Props | Description |
|-----------|-------|-------------|
| `DashboardOverview` | `DashboardOverviewProps` | Main dashboard layout with stats summary |
| `StatCard` | `StatCardProps` | Individual statistic display card |
| `WeeklySummaryWidget` | `WeeklySummaryWidgetProps` | Renders weekly summary data from `/api/stats/weekly/` |

### `events/`

| Component | Props | Description |
|-----------|-------|-------------|
| `EventForm` | `EventFormProps` | Full event creation/edit form (692 lines); handles recurrence, reminders, category selection |
| `EventCard` | `EventCardProps` | Compact event display card |

### `gradebook/`

| Component | Props | Description |
|-----------|-------|-------------|
| `GradebookLayout` | `GradebookLayoutProps` | Outer layout wrapper |
| `GradebookHeader` | `GradebookHeaderProps` | Page header with filters |
| `GradebookTable` | `GradebookTableProps` | Grade records table |
| `GradebookFilterCategories` | `GradebookFilterCategoriesProps` | Category filter panel |
| `GradebookStatus` | `GradebookStatusProps` | Grade status badge |

### `home/`

| Component | Props | Description |
|-----------|-------|-------------|
| `HomeNavbar` | — | Navigation bar for the landing page |
| `HeroSection` | — | Hero section with tagline and CTA |

### `layout/`

| Component | Props | Description |
|-----------|-------|-------------|
| `AppNavbar` | — | Main application navigation bar (authenticated state) |
| `AdminSidebar` | — | Sidebar for admin section pages |
| `BlurBackground` | `BlurBackgroundProps` | Backdrop blur overlay |
| `Footer` | — | Application footer |

### `modals/`

| Component | Props | Description |
|-----------|-------|-------------|
| `ConfirmationModal` | `ConfirmationModalProps` | Generic yes/no confirmation dialog |
| `CreateGradeModal` | `CreateGradeModalProps` | Grade entry modal |
| `RecurrenceScopeModal` | `RecurrenceScopeModalProps` | Choose `single`/`all`/`this_and_following` for recurring event edits |
| `ScopeActionModal` | `ScopeActionModalProps` | Generic scope selection modal |

### `notifications/`

| Component | Props | Description |
|-----------|-------|-------------|
| `NotificationBell` | — | Bell icon with unread badge; opens dropdown |
| `NotificationDropdown` | `NotificationDropdownProps` | Dropdown list of recent notifications |
| `NotificationCard` | `NotificationCardProps` | Single notification row |
| `NotificationsHeader` | — | Page header for `/notifications` |
| `NotificationsList` | `NotificationsListProps` | Full paginated notification list |
| `NotificationDetailHeader` | `NotificationDetailHeaderProps` | Header on detail page |
| `NotificationDetailBody` | `NotificationDetailBodyProps` | Body content of a single notification |
| `PushNotificationBanner` | — | Prompts user to enable push notifications |

### `settings/`

| Component | Props | Description |
|-----------|-------|-------------|
| `ThemeButton` | `ThemeButtonProps` | Theme selection button (16 themes) |
| `FontButton` | `FontButtonProps` | Typography selection button |

### `about/`

| Component | Props | Description |
|-----------|-------|-------------|
| `AboutHero` | — | Hero section for the about page |
| `AboutFeatureSection` | `AboutFeatureSectionProps` | Feature showcase grid |
| `AboutCta` | — | Call-to-action section |

---

## Hooks Reference

Hooks follow the `use{Domain}{Action}` naming convention and are grouped by domain under `src/hooks/`.

### Core / Common

| Hook | Returns | Description |
|------|---------|-------------|
| `useWebSocket` | `WebSocketState` | Manages WebSocket connection to `/ws/notifications/` |
| `useThemeFont` | `ThemeFontState` | Applies theme CSS class and font to the document root |
| `useReveal` | `ref` | Intersection Observer for scroll-reveal animations |

### Tasks

| Hook | Description |
|------|-------------|
| `useTaskList` | Composes all task list sub-hooks into a single interface for `TaskList.tsx` |
| `useTaskListQueries` | Fetches tasks and categories from the API |
| `useTaskListMutations` | Create/update/delete task mutations |
| `useTaskFormState` | Local form state for task create/edit |
| `useTaskFormMutations` | Submits task form to API |
| `normaliseTaskSubmission` | Transforms form data to API payload shape |

### Calendar / Events

| Hook | Description |
|------|-------------|
| `useCalendar` | Composes all calendar sub-hooks for `CalendarPage.tsx` |
| `useCalendarData` | Fetches events, tasks, and special dates from API |
| `useCalendarMutations` | Create/update/delete event mutations |
| `useCalendarState` | Selected date, view mode, and modal visibility state |
| `useCalendarInteractions` | Drag-and-drop, click, and slot-select handlers |

### Settings

| Hook | Description |
|------|-------------|
| `useSettings` | Composes all settings sub-hooks |
| `useSettingsState` | Local state for the settings form |
| `useProfileSettings` | Loads and saves profile data |
| `useThemes` | Loads available themes; handles selection persistence |
| `useSettingsActions` | Submit handlers for all settings sections |

### Notifications

| Hook | Description |
|------|-------------|
| `useNotificationsPage` | Data and actions for `/notifications` page |
| `useNotificationDetail` | Data and actions for `/notifications/:id` |
| `usePushSubscription` | Manages Web Push subscription lifecycle |
| `useNotificationLogic` | Shared notification state (unread count, mark read) |

### Admin Notifications

| Hook | Description |
|------|-------------|
| `useAdminBroadcastForm` | Complex broadcast form state (target selection, user filters, validation) |
| `useBroadcastSubmission` | Submits broadcast and polls delivery status |
| `useAdminHistory` | Fetches broadcast history with pagination |

### Profiles / Social

| Hook | Description |
|------|-------------|
| `usePublicProfile` | Fetches a public profile by username |
| `useLeaderboard` | Fetches leaderboard data |
| `useFriendships` | Manages friend list and request actions |
| `useSharing` | Manages event share send/receive/reply flow |

### Courses

| Hook | Description |
|------|-------------|
| `useCourse` | Course data and CRUD operations |
| `useTeacher` | Teacher profile and course management |
| `useCoursePermissions` | Fetches and caches course permission data |

---

## API Services

All services use a central Axios instance (`src/services/api.ts`) with an auth interceptor that attaches `Authorization: Token <token>` from `localStorage`.

| Service file | Key exports |
|---|---|
| `authService.ts` | `register`, `login`, `logout`, `deleteAccount`, `getUsernameById` |
| `taskService.ts` | `getTasks`, `createTask`, `updateTask`, `saveAndRescheduleTask`, `deleteTask` |
| `eventService.ts` | `getEvents`, `createEvent`, `updateEvent`, `deleteEvent`, `revertEventInstance`, `getServerTime` |
| `categoryService.ts` | `getCategories`, `createCategory`, `updateCategory`, `deleteCategory` |
| `preferenceService.ts` | `getMyPreference`, `updateMyPreference` |
| `profileService.ts` | `getMyProfile`, `updateMyProfile` |
| `publicProfileService.ts` | `getPublicProfile` |
| `friendshipService.ts` | `getFriendships`, `sendFriendRequest`, `acceptFriendRequest`, `declineFriendRequest`, `deleteFriendship` |
| `assessmentService.ts` | `getAssessments`, `createAssessment`, `updateAssessment`, `deleteAssessment` |
| `statsService.ts` | `getWeeklySummary` |
| `schedulerService.ts` | `scheduleTasks`, `unscheduleTasks` |
| `shareService.ts` | `getShares`, `sendShare`, `replyShare` |
| `courseService.ts` | `getCourses`, `getCourse`, `createCourse`, `joinCourse`, `leaveCourse`, `getCourseEvents`, `createCourseEvent`, `getStaff`, `getCurrentTeacher`, `makeMyTeacherProfile`, `unregisterMyTeacherProfile` |
| `pomoService.ts` | `recordSession` |
| `importService.ts` | `importEvents` |
| `exportService.ts` | `exportEvents` |
| `specialDatesService.ts` | `getSpecialDates`, `createSpecialDate`, `deleteSpecialDate` |
| `api/notifications.ts` | `getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`, `deleteNotification`, `subscribeToPush`, `unsubscribeFromPush`, `getVapidPublicKey`, `sendAdminNotification`, `getBroadcastHistory`, `getBroadcastDetail`, `retryFailedBroadcast`, `getAdminUsers` |

---

## State Management

Timely uses **React Context API** only — no Zustand, Redux, or other global state library.

### `PomodoroContext`

Located at `src/context/PomodoroContext.tsx`. Provides Pomodoro timer state (running, paused, elapsed time, session config) to all descendants. Mounted in `main.tsx`.

### `NotificationContext`

Located at `src/context/NotificationContext.tsx`. Provides:
- Unread notification count (polled and updated via WebSocket)
- Function to trigger a refetch of the unread count

Mounted in `main.tsx`, consumed by `NotificationBell` and any component displaying the badge.

---

## Theming

The application supports 16 themes defined as CSS variable files in `src/styles/themes/`. The active theme is applied by adding a class name to `document.documentElement` via the `useThemeFont` hook.

Each theme file defines these CSS custom properties:

| Variable | Description |
|----------|-------------|
| `--primary` | Primary accent colour |
| `--primary-hover` | Hover state for primary |
| `--background` | Page background |
| `--text-color` | Default text colour |
| `--border` | Border colour |

### Available themes

| Theme name | Class | Style |
|-----------|-------|-------|
| Light | `theme-light` | Clean blue on white |
| Dark | `theme-dark` | Blue on dark grey |
| Retro | `theme-retro` | Pink/purple |
| Taro | `theme-taro` | Purple |
| Bento | `theme-bento` | Orange |
| Plum Ink | `theme-plum-ink` | Dark purple |
| Paper | `theme-paper` | Sepia |
| Signal | `theme-signal` | Orange on dark |
| Coral | `theme-coral` | Coral red |
| Midnight | `theme-midnight` | Deep blue-black |
| Forest Night | `theme-forest-night` | Dark green |
| Sea Glass | `theme-sea-glass` | Teal |
| Ivy | `theme-ivy` | Green |
| Neon Noir | `theme-neon-noir` | Pink on near-black |
| Arctic | `theme-arctic` | Icy blue light |
| Terminal | `theme-terminal` | Green on black |

Theme preference is persisted in `localStorage` and re-applied on page load.

---

## Build and Configuration

### Vite (`vite.config.ts`)

- **Path alias:** `@` → `src/` (use `@/components/...` in imports)
- **Dev proxy:** `/api` and `/ws` proxied to `http://localhost:8000`
- **Plugins:** `@tailwindcss/vite`, `@vitejs/plugin-react`
- **Test:** Vitest with `globals: true`, coverage threshold 60% (lines, statements, branches, functions)

### TypeScript (`tsconfig.json`)

- Project references: `tsconfig.app.json` + `tsconfig.node.json`
- Strict mode enabled
- `verbatimModuleSyntax: true` — requires `import type` for type-only imports
- Path alias `@/*` → `./src/*`

### ESLint (`eslint.config.js`)

Flat config. Key rules:

| Rule | Level | Notes |
|------|-------|-------|
| `react-hooks/exhaustive-deps` | error | Missing hook deps forbidden |
| `@typescript-eslint/no-explicit-any` | warn | `any` type discouraged |
| `@typescript-eslint/consistent-type-imports` | error | `import type` required |
| `jsdoc/require-jsdoc` | error | Required on all public exports |
| `react/prop-types` | off | TypeScript handles this |

---

## Coding Conventions

| Convention | Rule |
|-----------|------|
| Component style | Arrow function components with explicit prop interfaces |
| Prop interface naming | `{ComponentName}Props` |
| Component exports | Named exports only (no default exports for utilities) |
| Event handlers | Prefix `on` (props) / `handle` (implementations) |
| Boolean props | Prefix `is`, `has`, or `should` |
| Hooks | Rules of hooks strictly enforced; no conditional hooks |
| Types | `any` forbidden; use `unknown` or specific types |
| JSDoc | Required on all exported functions and components |
