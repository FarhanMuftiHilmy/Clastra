# Architecture Review - Detailed Findings

This document presents specific, concrete findings discovered during the architectural review of the ScholaSync codebase. These findings are prioritized based on their architectural severity and potential impact on a production deployment.

---

## Finding 1: Single-Point State Coordination & Prop Drilling

- **Title:** State Accumulation in `App.tsx` and Prop-Drilling to Deeper Sub-Components
- **Severity:** Medium
- **Description:** High-level states (`students`, `classes`, `teachers`, `attendanceRecords`) are all gathered and updated in the root component `App.tsx` and then drilled down as props. While the data layer has been beautifully decoupled into services, the React UI layer still routes operations through `App.tsx` handler functions (e.g. `handleAddStudent`, `handleDeleteClass`).
- **Impact:** 
  - Sub-components such as `AdminDashboard` and `TeacherPortal` are forced to depend heavily on top-level props.
  - Adding or removing an action requires updating parameters in `App.tsx`, modifying interface definitions, and updating components down the render line, which increases friction.
- **Recommendation:** Introduce a lightweight client-side state-management library (such as **Zustand**) or native **React Context**. By wrapping the services and states in a central store, sub-components can selectively subscribe and call actions, eliminating prop-drilling entirely.
- **Priority:** Medium
- **Estimated Implementation Effort:** 4 - 6 hours

---

## Finding 2: Lack of Database Transactional Integrity in Cascading Deletes

- **Title:** Non-Atomic Cascading Deletions Across Independent Repositories
- **Severity:** High
- **Description:** When a class is deleted, `ClassService.deleteClass(id)` first removes the class, then iterates through all students to clear their class references, and finally sweeps the attendance records. This logic is handled client-side as separate operations.
- **Impact:** 
  - If a network failure occurs midway through a remote API call, the system will enter an inconsistent state (e.g., the class is deleted, but student associations or historical attendance logs remain in the database as orphaned pointers).
  - High probability of referential integrity errors.
- **Recommendation:** 
  - When migrating to the Go / PostgreSQL stack, delegate cascading rules to the database schema (`ON DELETE SET NULL` on `student.class_id`, `ON DELETE CASCADE` on `attendance_record.class_id`).
  - Keep the Service layer clean by wrapping multi-table modifications inside a single ACID-compliant database transaction.
- **Priority:** High
- **Estimated Implementation Effort:** 8 - 12 hours (during Go REST API implementation)

---

## Finding 3: Synchronous LocalStorage in Asynchronous Wrappers

- **Title:** Blocking I/O Behavior Simulated under Async Signatures
- **Severity:** Low
- **Description:** The `InMemory` repository implementations correctly use `async` / `await` and return `Promise` models to match remote environments. However, the internal mechanisms still read and write to `localStorage` synchronously.
- **Impact:** 
  - Reading or writing large datasets (e.g., thousands of historical records) blocks the main JavaScript execution thread, resulting in visible UI stutters or delayed visual responses.
  - While satisfactory for prototype testing, it fails to evaluate real-world network latencies, race conditions, or loading skeletons.
- **Recommendation:** Inject a simulated network latency multiplier (e.g., `await new Promise(resolve => setTimeout(resolve, 300))`) inside the in-memory repository methods in development mode. This allows developers to experience and design for natural loading screens, avoiding optimistic UI synchronization issues.
- **Priority:** Low
- **Estimated Implementation Effort:** 1 - 2 hours

---

## Finding 4: Security Token and Session Leaks in Client Memory

- **Title:** Persistent Sessions Stored without Safety Protections
- **Severity:** Medium
- **Description:** The `AuthService` stores the currently logged-in user inside `localStorage` under `sms_current_user` in plain JSON format. 
- **Impact:** 
  - The client UI reads this token without any validation.
  - Cross-Site Scripting (XSS) vectors can easily extract, alter, or impersonate user roles simply by manipulating local storage values.
- **Recommendation:** In the production environment, handle session state via secured, `HttpOnly` and `Secure` cookies managed by the Go REST API. Client-side storage should only hold transient non-sensitive layout preferences.
- **Priority:** High (for Production)
- **Estimated Implementation Effort:** 4 - 6 hours

---

## Finding 5: Lack of Optimistic Concurrency Control

- **Title:** High Risk of Race Conditions on Concurrent Attendance Logging
- **Severity:** Medium
- **Description:** If two teachers are taking attendance for the same class or on the same date concurrently, whichever submission lands last completely overwrites the record without prompting or checking for drift.
- **Impact:** 
  - Potential data loss of earlier corrections or administrative changes if multiple staff members access records simultaneously.
- **Recommendation:** Integrate an incremental version field or `updated_at` timestamp on `AttendanceRecord`. Before writing a record, the database should verify that the record version hasn't been modified since it was fetched by the client, warning the user if a newer revision exists.
- **Priority:** Medium
- **Estimated Implementation Effort:** 3 - 5 hours
