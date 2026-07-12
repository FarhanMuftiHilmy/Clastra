# ScholaSync - Deployment & Docker Setup Guide

This document outlines the containerized deployment architecture, local development configuration, and production guidelines for the **ScholaSync** platform.

---

## 1. Local Containerized Orchestration

ScholaSync features a single-command local orchestration workspace powered by **Docker Compose**. It spins up three distinct layers within a isolated bridge network:
1. **`db` (PostgreSQL Database Engine):** Standard, highly tuned relational store.
2. **`backend` (Go REST API):** Statically compiled Go API server.
3. **`frontend` (React client):** Production-built single page application served via Nginx.

```
                  ┌───────────────────────┐
                  │   Developer / Host    │
                  └──────────┬────────────┘
                             │ (port 3000)
                             ▼
                  ┌───────────────────────┐
                  │  Nginx Front Proxy    │ (part of frontend container)
                  └─────┬───────────┬─────┘
                        │           │
     (index.html / SPA) │           │ (proxy /api/v1/* to backend:8080)
                        ▼           ▼
                  ┌──────────┐ ┌──────────┐
                  │ Frontend │ │ Backend  │
                  │ (React)  │ │ (Go API) │
                  └──────────┘ └────┬─────┘
                                    │ (port 5432)
                                    ▼
                               ┌──────────┐
                               │ Postgres │
                               │   (DB)   │
                               └──────────┘
```

---

## 2. Docker Compose File Structure

The project root contains `docker-compose.yml`, which defines the orchestration layers:

- **Database Health Checking:** The `db` service utilizes standard Postgres `pg_isready` check commands. The `backend` container declares `condition: service_healthy` on its `depends_on` parameter, ensuring that the Go server never initiates connection handshakes before Postgres is ready to bind.
- **Durable Volumes:** Local database state is written inside the named Docker volume `pgdata` to survive container restarts and rebuilds.

---

## 3. Running Locally with Docker Compose

To run the complete full-stack environment locally:

```bash
# Build images and start all containers in the foreground
docker-compose up --build

# Run in detached (background) mode
docker-compose up -d --build

# View real-time aggregated logs
docker-compose logs -f

# Shut down and remove containers while preserving database volume
docker-compose down

# Shut down and clear all databases to start fresh
docker-compose down -v
```

Once running, the applications are bound on the following host ports:
- **React Frontend:** `http://localhost:3000` (automatically proxies API requests to the Go backend)
- **Go REST API:** `http://localhost:8080` (endpoints base: `/api/v1`)
- **PostgreSQL Database:** `localhost:5432` (accessible with credentials `postgres` / `postgres`)

---

## 4. Manual Database Migrations & Seeding

When deploying without Docker Compose, or to manually reset the local database container:

```bash
# Enter the running database container
docker exec -it scholasync-db psql -U postgres -d scholasync

# Or, run migration files directly from host (assuming local psql CLI is installed)
psql -h localhost -U postgres -d scholasync -f backend/db/migrations/000001_init.up.sql
psql -h localhost -U postgres -d scholasync -f backend/db/seeds/seed.sql
```

---

## 5. Production Build & Cloud Run Guidelines

To compile and deploy the ScholaSync services inside production Kubernetes or Google Cloud Run:

### A. Deploying the Backend API
The Go application is compiled in a hardened, two-stage Docker container. It produces a fully self-contained static executable with zero OS dependency overhead:
1. Build the image: `docker build -t gcr.io/scholasync/backend:latest ./backend`
2. Push to your registry: `docker push gcr.io/scholasync/backend:latest`
3. Deploy to Cloud Run, setting the `DATABASE_URL` and `JWT_SECRET` variables from secure Google Secret Manager handles.

### B. Deploying the Frontend Client
The frontend React bundle is pre-compiled to optimized HTML/JS/CSS assets during the builder phase and placed into an Alpine-based Nginx container:
1. Build the image: `docker build -t gcr.io/scholasync/frontend:latest ./frontend`
2. Push to your registry: `docker push gcr.io/scholasync/frontend:latest`
3. Deploy to Cloud Run, setting the `VITE_API_URL` to point to the active backend DNS endpoint.
