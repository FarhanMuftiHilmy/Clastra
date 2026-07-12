# ScholaSync - Go REST API Specification & Contract

Welcome to the backend engineering contract and API specification directory for **ScholaSync**.

This subdirectory outlines the complete REST API blueprints, database schemas, authentication handshakes, and error-handling protocols required to build a high-performance **Go REST API** backed by a **PostgreSQL** relational database. This contract is designed to fully replace the current `InMemory` local-storage repositories with zero modification to the React user interfaces.

---

## 📂 Documentation Manifest

This specification is modularized into several focused architecture files:

1. **[`README.md`](./README.md) (This File):** Overview of conventions, path strategies, scaling guidelines, and header usage.
2. **[`openapi.yaml`](./openapi.yaml):** Fully compliant OpenAPI 3.1.0 specification detailing endpoints, query parameters, payload payloads, and schemas. Can be imported directly into Swagger, Postman, or Redocly.
3. **[`endpoints.md`](./endpoints.md):** Human-readable, developer-centric guide detailing every endpoint, validation rules, user permissions, and example payloads.
4. **[`authentication.md`](./authentication.md):** Security blueprint detailing stateless JWT exchange, cookie configurations, role claims, and logout behaviors.
5. **[`data-model.md`](./data-model.md):** PostgreSQL relational mapping, foreign keys, constraints, cascade deletion behaviors, and performance-tuned composite indexes.
6. **[`error-codes.md`](./error-codes.md):** Uniform RFC 7807-compliant problem details for error reporting, standardizing validation failures, and conflict resolutions.

---

## 🛠️ API Design Conventions

To maintain standard enterprise-grade REST architecture, the future Go API must adhere strictly to these rules:

### 1. Global Prefix and Versioning
All api pathways must be explicitly prefixed with their major version number to avoid breaking active clients during future schema iterations:
```http
https://api.scholasync.edu/api/v1
```

### 2. URI Format
- Use **kebab-case** for multi-word URI segments: `/api/v1/attendance-records` (if applicable) or `/api/v1/attendance`.
- Resource names must always be plural nouns: `/students`, `/classes`, `/teachers`.
- Use standard identifier route variables for individual entities: `/api/v1/students/{id}`.

### 3. Request/Response Payloads
- **Content-Type:** Requests with body payloads and all successful JSON responses must include the header `Content-Type: application/json`.
- **Naming Casing:** JSON object keys must be formatted in standard **camelCase** to maintain strict, seamless mapping to the existing TypeScript client-side models:
  ```json
  {
    "rollNumber": "10A04",
    "classId": "cls_123"
  }
  ```

### 4. Idempotency & HTTP Methods
The API maps perfectly to REST semantic definitions:
- **`GET`**: Retrieves entities. Safe and Idempotent. Must never modify database state.
- **`POST`**: Creates new entities. Non-idempotent.
- **`PUT`**: Fully replaces existing resource states. Idempotent.
- **`PATCH`**: Partially updates specific entity properties. Non-idempotent.
- **`DELETE`**: Permanently removes entities. Idempotent.

### 5. Transport Protocol & Security
- **TLS Enforced:** All communication in production must be forced over HTTPS (`TLS 1.3`).
- **CORS Constraints:** Cross-Origin Resource Sharing must be configured explicitly in the Go Gin/Fiber router to only accept calls from trusted client subdomains, blocking wildcard (`*`) origins.
