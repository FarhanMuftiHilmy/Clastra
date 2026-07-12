# ScholaSync - Codebase Module Map

This document serves as a map of the file hierarchy, module responsibilities, and structural imports across ScholaSync.

---

## 1. Directory Structure

The files analyzed in the workspace root are organized as follows:

```
├── .env.example              # Template for environment variables (currently empty)
├── index.html                # Main HTML page shell
├── metadata.json             # Applet descriptor (ScholaSync, permissions, capabilities)
├── package.json              # Dependency manifests & build scripts
├── vite.config.ts            # Vite compiler configuration
├── tsconfig.json             # TypeScript compiler settings
├── src/
│   ├── main.tsx              # Application entry point & mounting hook
│   ├── index.css             # Tailwind @import standard stylesheet with Inter/Mono fonts
│   ├── types.ts              # System interfaces and enums (Models)
│   ├── data.ts               # Core database seeding & mock generator
│   ├── App.tsx               # Primary App controller & state engine
│   └── components/
│       ├── AuthScreen.tsx    # Role selection & login gate
│       ├── DeviceFrame.tsx   # Simulated iPad viewport frame container
│       ├── TeacherPortal.tsx # Touch-optimized teacher grading application
│       └── AdminDashboard.tsx# Full analytics, auditing, and CRUD manager
```

---

## 2. Module Responsibilities & Exports

### A. Core Models (`src/types.ts`)
Defines the strictly typed domain schemas:
- `Student`: Fields for `id`, `name`, `rollNumber`, `email`, `classId`, and `gender`.
- `Class`: Fields for `id`, `name`, `grade`, `room`, and `teacherId`.
- `Teacher`: Fields for `id`, `name`, `email`, and `subject`.
- `AttendanceRecord`: Combines `classId`, `date`, `submittedBy`, `submittedAt`, and an array of `StudentAttendance` `{ studentId, status }`.
- `CurrentUser`: Describes the logged-in session (either admin or a specific teacher).

### B. Seed Engine (`src/data.ts`)
Injects initial school registers and calculates mock histories:
- `INITIAL_TEACHERS`: Sinks 4 default teachers (`t1` to `t4`).
- `INITIAL_CLASSES`: Sinks 4 default grade classes (`c1` to `c4`).
- `INITIAL_STUDENTS`: Sinks 18 students pre-allocated across cohorts.
- `generateInitialAttendance()`: Deterministically builds a robust 5-day historical attendance registry for all 18 students across the previous business week. This feeds the analytics Recharts engine immediately on cold startup.

### C. State coordinator (`src/App.tsx`)
The heartbeat of the application, managing centralized state variables:
- **Global State variables:**
  - `teachers` (`Teacher[]`)
  - `classes` (`Class[]`)
  - `students` (`Student[]`)
  - `attendanceRecords` (`AttendanceRecord[]`)
  - `currentUser` (`CurrentUser | null`)
- **Key Methods drilled to components:**
  - `handleLogin`: Authenticates email/password against active teachers or admin roles.
  - `handleLogout`: Destroys user sessions, returning to auth screen.
  - `handleSubmitAttendance`: Appends or overwrites student attendance states inside `attendanceRecords`.
  - `handleCRUD`: High-level state updater functions (`addStudent`, `updateStudent`, `deleteStudent`, `addClass`, `updateClass`, `deleteClass`).

---

## 3. Dependency & Render Diagram

```
         [index.html]
              │
         [main.tsx]
              │
          [App.tsx] ◄─────────────── [types.ts]
              │  ├────────────────── [data.ts]
              │  ▼
      ┌───────┴────────────────────────┐
      ▼                                ▼
[AuthScreen]                    [DeviceFrame]
                                       │
                                       ▼
                                [TeacherPortal]
                                       │
                                       ▼
                              [AdminDashboard] (Recharts & CSV Exports)
```

---

## 4. Installed Packages

The following npm packages are utilized inside `package.json`:
- `react`, `react-dom` (Core runtime library)
- `motion` / `motion/react` (Animations)
- `recharts` (Data visualization)
- `lucide-react` (System vector iconography)
- `canvas-confetti` (Visual reward highlights)
- `tsx` / `esbuild` / `vite` (Compiling pipelines)
