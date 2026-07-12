# Architecture Review - Decision Log

This log chronicles major architectural decisions, selected design patterns, rejected alternatives, and operational rationales governing the evolution of the ScholaSync software stack.

---

## Decision ADR-001: The Repositories-Services Architecture Pattern

- **Status:** **APPROVED**
- **Date:** 2026-07-12
- **Context:** 
  The codebase previously utilized tightly coupled `useState` hooks inside `App.tsx` containing direct mutations of complex lists. There was no clean way to redirect those writes to a remote database without completely rewriting the UI components.
- **Decision:** 
  Introduce a classic **Repository-Service Pattern** (Layered Architecture). High-level UI elements subscribe to services, while services fetch data via abstract repository interfaces.
- **Rationale:** 
  It provides an elegant contract. The React app is guaranteed a certain shape of data, allowing the underlying database to change from synchronous mock files to an enterprise Go REST API without changing a single line of component JSX.
- **Alternatives Rejected:**
  - *Direct Axios/Fetch calls in Components:* Quick to write but leads to severe technical debt and spaghetti code.
  - *GraphQL Gateway:* Powerful, but introduces excessive tooling overhead (compilers, schema managers) that exceeds the functional scope of a classroom application.

---

## Decision ADR-002: Dependency Injection via Static Service Container

- **Status:** **APPROVED**
- **Date:** 2026-07-12
- **Context:**
  Classes and repositories must be instanced and coupled. We need a way to link `StudentService` with `StudentRepository` and `AttendanceRepository`.
- **Decision:**
  Create a centralized singleton container (`src/core/container.ts`) that instantiates repositories and injects them as parameters into service constructors.
- **Rationale:**
  Avoids the overhead of bulky Dependency Injection (DI) frameworks (such as InversifyJS or TSyringe), which require experimental decorator configurations, keeping compile times fast and the bundle size minimal. It remains easy to comprehend and fully type-safe.
- **Alternatives Rejected:**
  - *Manual instantiation inside components:* Re-creates connection pools and database states on every component re-render, leading to state drift.
  - *InversifyJS:* Rejected due to complexity, size, and dependency on unstable TypeScript experimental metadata flags.

---

## Decision ADR-003: In-Memory Storage Proxying to LocalStorage

- **Status:** **APPROVED**
- **Date:** 2026-07-12
- **Context:**
  The user requested no physical database introduction at this stage, while also requiring robust preservation of sandbox changes.
- **Decision:**
  Direct repositories to load default hardcoded lists on cold boots, write subsequent changes to browser `localStorage`, and resolve queries using standard Promises.
- **Rationale:**
  Simulates a real database engine. It fulfills the user request for no immediate backend while offering a persistent offline sandbox that does not wipe upon refresh.
- **Alternatives Rejected:**
  - *Volatile Memory States:* Resets all edits upon page reload, leading to frustrating tester workflows.
  - *IndexedDB:* Offers transactional power but introduces highly complex, asynchronous callback-based code structures that increase technical debt.

---

## Decision ADR-004: Decoupled Deletion Rules via Domain Services

- **Status:** **APPROVED**
- **Date:** 2026-07-12
- **Context:**
  Deleting a class should not orphan students or retain outdated attendance records in local registry.
- **Decision:**
  Define cascade deletion orchestration inside the `ClassService` rather than leaving it to repositories. 
- **Rationale:**
  The Repository layer should focus solely on simple CRUD operations. Relational business rules (like clean cascading unassignments) belong entirely inside the Domain Service layer to maintain clean separation of concerns.
