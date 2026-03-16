# TripMind React Migration (Phase 1)

This folder contains a React + TypeScript + Tailwind scaffold for migrating the current planner.

## Current scope

- Framework shell bootstrapped with Vite
- `@tanstack/react-query` provider configured
- Minimal persistence panel for `userId` + `tripId`
- Reads/writes planner state via backend endpoints:
  - `PUT /api/state`
  - `GET /api/state`

## Run

```bash
npm install
npm run dev
```

For backend persistence, run the backend server from `../backend` so `/api` is available.
