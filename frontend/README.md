# Timely Frontend

Frontend for Timely, a student time-management platform built with React, TypeScript, Vite, and Tailwind CSS.

## Prerequisites

- Node.js
- npm
- Python and the Django backend if you want to run the full stack locally

## Installation

From the `frontend/` directory:

```bash
npm install
```

## Development

Start the frontend development server:

```bash
npm run dev
```

Start the frontend and backend together from the `frontend/` directory:

```bash
npm run main
```

This relies on the backend being runnable with:

```bash
python ../backend/manage.py runserver
```

## API and WebSocket proxying

The Vite development server proxies requests to the backend:

- `/api` -> `http://localhost:8000`
- `/ws` -> `http://localhost:8000` with WebSocket support enabled

## Available scripts

- `npm run dev` - start the Vite development server
- `npm run client` - alias for `npm run dev`
- `npm run server` - start the Django development server from the frontend directory
- `npm run main` - run both the backend and frontend together
- `npm run build` - type-check and build the frontend for production
- `npm run preview` - preview the production build
- `npm run lint` - run ESLint across the frontend
- `npm run test` - run the Vitest test suite
- `npm run test:ui` - open the Vitest UI
- `npm run test:coverage` - run tests with coverage output

## Testing

This frontend uses Vitest and Testing Library.

Run all frontend tests:

```bash
npm run test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Coverage thresholds are configured in [vite.config.ts](./vite.config.ts).

## Project structure

- `src/api` - API helpers and request wrappers
- `src/assets` - static assets
- `src/components` - reusable UI components
- `src/context` - shared React context providers
- `src/hooks` - custom React hooks
- `src/layouts` - shared page layouts
- `src/pages` - route-level pages
- `src/services` - frontend service-layer logic
- `src/styles` - styling resources
- `src/types` - shared TypeScript types
- `src/utils` - utility helpers

## Notes

- The `@` alias resolves to `src`
- The frontend expects the backend to be available locally during development
- For project-wide setup and submission instructions, see the root [README.md](../README.md)
