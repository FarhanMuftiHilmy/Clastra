# ScholaSync - Authentication Flow

This document details the stateless JWT (JSON Web Token) authentication architecture designed for the future Go REST API of ScholaSync.

---

## 1. Authentication Handshake Flow

The ScholaSync API implements secure, stateless authentication using JSON Web Tokens. In production, this token should be transported in a highly secure, HttpOnly, SameSite cookie to defend against Cross-Site Scripting (XSS) vectors.

```
┌──────────┐                                                   ┌──────────┐
│  Client  │                                                   │  Go API  │
└────┬─────┘                                                   └────┬─────┘
     │                                                              │
     │ 1. POST /auth/login (Email, Role, Password)                  │
     ├─────────────────────────────────────────────────────────────>│
     │                                                              │
     │ 2. Verify credentials in DB                                  │
     │    Generate JWT token with claims                            │
     │                                                              │
     │ 3. Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict│
     │    Response Status 200 OK                                    │
     |<─────────────────────────────────────────────────────────────┤
     │                                                              │
     │                                                              │
     │ 4. GET /api/v1/students (Cookie automatically appended)      │
     ├─────────────────────────────────────────────────────────────>│
     │                                                              │
     │ 5. Middleware decrypts cookie and validates JWT claims       │
     │                                                              │
     │ 6. Response Status 200 OK                                    │
     |<─────────────────────────────────────────────────────────────┤
```

---

## 2. JWT Payload Claims Schema

The token payload contains the non-sensitive identity attributes and role claims of the authenticated user:

```json
{
  "sub": "admin_1",
  "name": "Principal Arthur",
  "email": "admin@school.edu",
  "role": "admin",
  "iss": "scholasync-auth-service",
  "aud": "scholasync-client-app",
  "iat": 1783850400,
  "exp": 1783854000
}
```

### Claims Definition:
- **`sub` (Subject):** The unique UUID or primary key of the User inside the Database.
- **`role`:** Controls granular controller-level authorization filters (`admin` vs `teacher`).
- **`iat` (Issued At):** Standard epoch timestamp of token generation.
- **`exp` (Expiration Time):** Set to expire in 1 hour under standard configurations.

---

## 3. Cookie Transport Parameters (Production Guidelines)

To prevent client-side JavaScript from accessing session tokens (eliminating XSS token theft), the backend must append the following headers on successful logins:

```http
Set-Cookie: access_token=<JWT_TOKEN_STRING>; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=Strict
```

| Parameter | Recommended Setting | Purpose |
|---|---|---|
| **`HttpOnly`** | `true` | Completely blocks any client-side JavaScript (`document.cookie`) from reading the cookie, neutralizing XSS. |
| **`Secure`** | `true` | Restricts cookie transport strictly to HTTPS tunnels. |
| **`SameSite`** | `Strict` | Blocks cookie transport on cross-site requests, mitigating Cross-Site Request Forgery (CSRF). |
| **`Path`** | `/` | Restricts cookie visibility to all endpoints on the domain. |

---

## 4. Role-Based Access Control (RBAC)

Below is the authorization mapping table implemented as standard middleware in the Go API:

| Endpoint | HTTP Method | Permitted Roles | Middleware Rule / Verification |
|---|---|---|---|
| `/auth/login` | `POST` | All (Public) | None |
| `/auth/logout` | `POST` | All (Authenticated) | Verify active session token |
| `/students` | `GET` | `admin`, `teacher` | Retrieve full list |
| `/students` | `POST` | `admin` | Block `teacher` with `403 Forbidden` |
| `/students/{id}` | `PUT` | `admin` | Block `teacher` with `403 Forbidden` |
| `/students/{id}` | `DELETE`| `admin` | Block `teacher` with `403 Forbidden` |
| `/classes` | `GET` | `admin`, `teacher` | Retrieve full list |
| `/classes` | `POST` | `admin` | Block `teacher` with `403 Forbidden` |
| `/classes/{id}` | `PUT` | `admin` | Block `teacher` with `403 Forbidden` |
| `/classes/{id}` | `DELETE`| `admin` | Block `teacher` with `403 Forbidden` |
| `/teachers` | `GET` | `admin`, `teacher` | Access reference list |
| `/attendance` | `GET` | `admin`, `teacher` | Filter by class/date |
| `/attendance` | `POST` | `admin`, `teacher` | Validates if the teacher is assigned to the class |
