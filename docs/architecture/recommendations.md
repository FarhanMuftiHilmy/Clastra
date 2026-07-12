# Architecture Review - Prioritized Recommendations

This document details the roadmap of recommendations to transition ScholaSync from its current in-memory structure to a high-scale, production-ready, enterprise-grade architecture.

---

## Roadmap Overview

```
  Phase 1: UI State Refinement ────────► Phase 2: Remote API Bridge ────────► Phase 3: DB Integration
  (Zustand / Centralized Context)       (Go REST API / CORS / JWT)          (PostgreSQL / ACID / Cascades)
```

---

## 1. Phase 1: Client-Side State Consolidation (High Priority)

### Action: Replace Prop Drilling with Zustand or React Context
Currently, state propagation routes through `App.tsx`, which forces child components to act as pass-through structures for unrelated variables.

- **Implementation Details:**
  1. Define a central `useSchoolStore` that wraps `studentService`, `classService`, `teacherService`, `attendanceService`, and `authService`.
  2. Maintain active states directly in the store.
  3. Let `AdminDashboard` and `TeacherPortal` pull values natively from the store:
     ```ts
     const students = useSchoolStore(state => state.students);
     const deleteStudent = useSchoolStore(state => state.deleteStudent);
     ```
- **Architectural Benefit:** Complete isolation of components. Reduces unnecessary renders and simplifies UI testing.

---

## 2. Phase 2: The Go REST API Transition (Medium Priority)

### Action: Implement a REST API Gateway
Since the repository layer uses clean abstractions returning `Promise<T>`, you can migrate to a Go-backend with zero impact on UI.

- **Implementation Details:**
  1. Define a standard JSON REST API schema in Go (e.g., using **Gin** or **Fiber**).
  2. Implement an `ApiStudentRepository`, `ApiClassRepository`, etc., that use standard HTTP `fetch` calls behind the scenes:
     ```ts
     export class ApiStudentRepository implements IStudentRepository {
       async getAll(): Promise<Student[]> {
         const res = await fetch('/api/v1/students');
         return res.json();
       }
       // ... Other CRUD methods
     }
     ```
  3. Swap the instantiation inside `src/core/container.ts`:
     ```ts
     // Simply swap the binding!
     export const studentRepository = new ApiStudentRepository();
     ```
- **Architectural Benefit:** Zero regression risk for user-facing features. Complete implementation decoupling.

---

## 3. Phase 3: Transactional Security & Integrity (High Priority)

### Action: Implement Server-Side Transactions and Strict Constraints
Client-side joins (such as unassigning students during class deletes) must be shifted to transactional SQL boundaries.

- **Implementation Details:**
  1. Leverage PostgreSQL foreign key relations:
     ```sql
     ALTER TABLE students 
     ADD CONSTRAINT fk_class 
     FOREIGN KEY (class_id) 
     REFERENCES classes(id) 
     ON DELETE SET NULL;
     ```
  2. In the Go backend, wrap complex multitable changes inside database transactions (`db.Begin()` / `tx.Commit()`).
- **Architectural Benefit:** Guards school registries against network latency interruptions and preserves data correctness.

---

## 4. Prioritization Matrix

| Task | Category | Priority | Est. Effort | Architectural Value |
|---|---|---|---|---|
| **Zustand State Engine** | Code Cleanliness | High | 4-6 Hours | Eliminates UI prop-drilling & tight coupling |
| **Go API Client Repos** | Forward Porting | Medium | 8-12 Hours | Establishes scalable remote network queries |
| **Database Transactions** | Security / Sync | High | 6-8 Hours | Eliminates referential gaps during mutations |
| **Secure JWT Cookies** | Authentication | High | 4-6 Hours | Eradicates credential hijacking risks |
| **Network Latency Mock** | UX / Quality | Low | 1-2 Hours | Helps designers evaluate pending state skeletons |
