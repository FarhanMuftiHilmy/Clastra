# ScholaSync - User Roles and Permissions

ScholaSync enforces role-based interfaces. Below is the documentation of user roles, their responsibilities, authorized views, and system privileges.

---

## 1. Role Matrix

The system maps users to either **Super Administrator** or **Teacher** roles. Both roles interact with a single synchronized ledger in memory.

| Feature / Action | Super Administrator | Class Instructor (Teacher) |
|---|:---:|:---:|
| **Access System Overview Stats** | Yes | No |
| **Mark Daily Class Attendance** | No | Yes |
| **Create / Edit / Delete Students** | Yes | No |
| **Create / Edit / Delete Classes** | Yes | No |
| **Audit Daily Attendance Ledger** | Yes | No |
| **Search & Filter School Rosters** | Yes | No |
| **Export Attendance Logs to CSV** | Yes | No |
| **View Analytics Charts (Recharts)** | Yes | No |
| **Choose Roster Date range** | Yes (via log tab) | Yes (via date picker) |

---

## 2. Super Administrator

The **Super Administrator** holds full custody over school registries, enrollment limits, curriculum setups, and analytics auditing.

- **Primary Interface:** Desktop Web Portal layout featuring a navigation sidebar, high-density search grids, responsive charts, and modal action forms.
- **Key Responsibilities:**
  - Standardizing grade cohorts (establishing classes and allocating rooms).
  - Registering newly admitted students and assigning them to correct cohorts.
  - Sourcing class instructors (assigning teachers as primary class managers).
  - Exporting attendance logs for formal archives or parental notifications.
  - Reviewing attendance trends to address persistent absenteeism or class-capacity bottlenecks.
- **Login Instance:** Bypasses simulated device constraints, displaying the full viewport size.

---

## 3. Class Instructor (Teacher)

The **Teacher** role acts as the primary operational data-input agent. Their workflow is focused and fast, ensuring zero friction when calling roll inside a busy classroom.

- **Primary Interface:** Simulated iPad/tablet mobile touch-screen dashboard (`TeacherPortal.tsx`) embedded within a structural hardware mock shell (`DeviceFrame.tsx`).
- **Key Responsibilities:**
  - Logging in daily to access assigned classes.
  - Selecting the current class roster.
  - Adjusting target roll-call dates to record late or historical submissions.
  - Adjusting individual student states to correct categories (Present, Sick, Excused, Absent).
  - Submitting class ledger updates, which instantly recalculate school metrics.
- **Scoping Rule:** A teacher is **only** allowed to view and submit attendance records for classes explicitly assigned to their unique ID (`teacherId` in `Class`). Classes assigned to other instructors are hidden.
