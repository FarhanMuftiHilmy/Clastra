# ScholaSync - Production-Ready Monorepo Workspace

ScholaSync is a comprehensive full-stack school management system designed with **Clean Architecture** patterns. It features an interactive, highly polished React client frontend, a high-performance Go REST API backend, and a PostgreSQL database layer.

This repository is organized as a unified **monorepo** to enable smooth local orchestration, easy service boundaries, and robust docker-compose automation while preserving complete independence between the client application and the API server.

---

## 🚀 Architectural Blueprint & Project Layout

```
school-management/
├── frontend/                  # React + Vite Client Application
│   ├── src/                   # Client source code (Presentation → Services → Repositories)
│   │   ├── core/              # Business core & dependency injector container
│   │   └── components/        # Tailwind-styled components
│   ├── Dockerfile             # Multi-stage optimized Nginx build
│   └── nginx.conf             # Nginx server reverse proxy setup
│
├── backend/                   # Go REST API Server
│   ├── config/                # Environment config structures
│   ├── models/                # Typed domain models & RFC 7807 problem payloads
│   ├── repository/            # PostgreSQL-backed transactional repositories
│   ├── service/               # Core business constraints, validation, and JWT signatures
│   ├── handler/               # REST controller HTTP routes with Go 1.22 routing
│   ├── middleware/            # JWT, RBAC role-checks, structured logging, CORS, and Recovery
│   ├── db/
│   │   ├── migrations/        # PostgreSQL DDL table setup & index keys
│   │   └── seeds/             # Seed SQL statements to populate initial state
│   └── Dockerfile             # Hardy two-stage Go container compiler
│
├── docs/                      # Shared System Documentation
│   ├── architecture/          # Multi-layer clean architecture logs
│   ├── api/                   # OpenAPI YAML, auth cookies, and error schemas
│   ├── deployment/            # Docker deployment & Kubernetes guidelines
│   └── testing/               # Integration testing checklist
│
├── docker-compose.yml         # Dev Orchestration (Database → Backend → Frontend)
├── package.json               # Root proxy delegator script manager
└── README.md                  # This master reference document
```

---

## 🛠️ Environment Variables Configuration

To run ScholaSync locally, create a `.env` file in the root directory (based on `.env.example`):

| Variable | Default Value | Purpose |
|---|---|---|
| `PORT` | `8080` | Bind port for the Go REST API. |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/scholasync?sslmode=disable` | Database connection string. |
| `JWT_SECRET` | `scholasync-super-secret-signature-key-2026` | Symmetric key used to sign session cookies. |
| `ALLOWED_CORS` | `http://localhost:3000` | Whitelisted frontend origin for cross-site queries. |
| `VITE_USE_API` | `true` | Client toggle. If `true`, connect via HTTP; if `false`, run offline. |
| `VITE_API_URL` | `http://localhost:8080/api/v1` | Root REST URL for the client. |

---

## 🐳 Quick Start: Docker Compose Orchestration

The entire system—including the frontend proxy, backend router, and initialized database—can be booted with a single command:

```bash
# 1. Build and boot all containers
docker-compose up --build

# 2. Re-run in detached mode (background)
docker-compose up -d --build

# 3. View real-time aggregated logs across all layers
docker-compose logs -f

# 4. Tear down containers while retaining database state
docker-compose down

# 5. Tear down and wipe database to start fresh
docker-compose down -v
```

Once booted:
- **Frontend App:** `http://localhost:3000`
- **Backend API:** `http://localhost:8080/api/v1`
- **Postgres Engine:** `localhost:5432`

---

## 💻 Manual Developer Setup (Step-by-Step)

If you prefer to run the components separately on your host system:

### Prerequisite Checklist
- **Go 1.22+** installed on host
- **Node.js 20+** installed on host
- **PostgreSQL 16+** service running on port `5432`

### 1. Initialize the Database
1. Create a database named `scholasync`.
2. Apply migrations:
   ```bash
   psql -h localhost -U postgres -d scholasync -f backend/db/migrations/000001_init.up.sql
   ```
3. Apply seed records:
   ```bash
   psql -h localhost -U postgres -d scholasync -f backend/db/seeds/seed.sql
   ```

### 2. Launch the Go REST API Backend
```bash
cd backend
# Download Go packages
go mod download

# Set configuration variables
export PORT=8080
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/scholasync?sslmode=disable"
export JWT_SECRET="scholasync-super-secret-signature-key-2026"
export ALLOWED_CORS="http://localhost:3000"

# Boot server
go run main.go
```

### 3. Launch the React Frontend Client
From the project root, you can delegate installation and execution commands using npm:

```bash
# Install frontend package dependencies
npm --prefix frontend install

# Boot React client in development mode
npm run dev
```

The React app will bind to `http://localhost:3000`.

---

## 🧪 Technical Quality & Testing

### Running Tests
- **Go Backend Tests:** `cd backend && go test -v ./...`
- **Frontend Validation Lints:** `npm run lint`

For detailed testing workflows, refer to the documentation inside `/docs/testing/testing-guide.md`.
