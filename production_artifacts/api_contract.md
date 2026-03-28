# API Contract — dev_env_docker

## Overview

This document defines the interfaces exposed by the Docker dev environment stack.
All services are accessible via Kong API Gateway on `PORT_KONG` (default: `54321`).

---

## Service Endpoints

### Kong API Gateway
- **Local URL**: `http://localhost:<PORT_KONG>`
- **Purpose**: Single entry point for all Supabase services
- **Auth**: Pass `apikey` header with either `ANON_KEY` or `SERVICE_ROLE_KEY`

### Supabase REST API (PostgREST)
- **URL**: `http://localhost:<PORT_KONG>/rest/v1/`
- **Docs**: https://postgrest.org/en/stable/
- **Auth header**: `apikey: <ANON_KEY>` or `apikey: <SERVICE_ROLE_KEY>`
- **Example**:
  ```
  GET /rest/v1/<table>?select=*
  Authorization: Bearer <JWT>
  apikey: <ANON_KEY>
  ```

### Supabase Auth (GoTrue)
- **URL**: `http://localhost:<PORT_KONG>/auth/v1/`
- **Key endpoints**:
  - `POST /auth/v1/signup` — Register a new user
  - `POST /auth/v1/token?grant_type=password` — Sign in
  - `POST /auth/v1/logout` — Sign out
  - `GET  /auth/v1/user` — Get current user

### Supabase Realtime
- **WebSocket URL**: `ws://localhost:<PORT_KONG>/realtime/v1/websocket`
- **Auth**: `apikey` query param or header

### Supabase Storage
- **URL**: `http://localhost:<PORT_KONG>/storage/v1/`
- **Key endpoints**:
  - `GET  /storage/v1/bucket` — List buckets
  - `POST /storage/v1/object/<bucket>/<path>` — Upload file
  - `GET  /storage/v1/object/public/<bucket>/<path>` — Download public file

### Supabase Studio
- **URL**: `http://localhost:<PORT_STUDIO>`
- **Purpose**: Web UI for database management, auth, storage

### Web Frontend
- **URL**: `http://localhost:<PORT_WEB>`
- **Tech**: nginx:alpine (placeholder)

### API Backend
- **URL**: `http://localhost:<PORT_API>`
- **Tech**: node:20-alpine (placeholder)
- **Environment variables consumed**:
  - `DATABASE_URL` — Direct PostgreSQL connection
  - `SUPABASE_URL` — Kong base URL
  - `SUPABASE_ANON_KEY` — Public Supabase key
  - `SUPABASE_SERVICE_ROLE_KEY` — Admin Supabase key
  - `JWT_SECRET` — Shared JWT signing secret

---

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `PROJECT_NAME` | Docker Compose project name | `etshop_3000` |
| `PORT_WEB` | Frontend port | `3000` |
| `PORT_API` | Backend port | `3001` |
| `PORT_STUDIO` | Supabase Studio port | `54323` |
| `PORT_DB` | PostgreSQL port | `54322` |
| `PORT_KONG` | Kong gateway port | `54321` |
| `PORT_INBUCKET` | Email testing UI port | `54324` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `JWT_SECRET` | JWT signing secret | `super-secret-jwt-token-...` |
| `ANON_KEY` | Supabase anon JWT | *(dev default)* |
| `SERVICE_ROLE_KEY` | Supabase service role JWT | *(dev default)* |

---

## Script Interface

| Script | Arguments | Description |
|--------|-----------|-------------|
| `scripts/dev-up.sh` | `[--port-web N] [--port-studio N]` | Start an instance |
| `scripts/dev-down.sh` | `--port-web N [--clean]` | Stop an instance |
| `scripts/dev-list.sh` | _(none)_ | List active instances |

---

## active.json — dev_stack shape

After calling `start_dev_stack.md`, the `dev_stack` field in `.agents/state/active.json` is:

```json
{
  "dev_stack": {
    "project_name": "etshop_3000",
    "port_web": 3000,
    "port_studio": 54323,
    "port_kong": 54321,
    "status": "running"
  }
}
```

After `stop_dev_stack.md`: `"dev_stack": null`.
