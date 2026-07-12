# ScholaSync - User Flows & Journeys

This document outlines the step-by-step user journeys and logical pathways implemented in ScholaSync.

---

## 1. Authentication & Login Flow

```
[Start]
   │
   ▼
[AuthScreen: Choose Role] ──► (Select Admin or Teacher)
   │
   ├─► [Manual Input: Email & Password]
   │         OR
   └─► [Fast Sandbox Select: Choose predefined Teacher or Admin credentials]
   │
   ▼
[Submit Form]
   │
   ├──► [Credentials Match?] ── NO ──► [Show red error callout] ──► (Retry)
   │
   └──► YES
         │
         ▼
     [Redirect by Role]
         │
         ├─► [Admin] ──► Render Desktop Admin Dashboard
         │
         └─► [Teacher] ──► Render iPad Device Simulated Teacher App
```

---

## 2. Teacher Roll Call Submission Flow

```
[Teacher Authenticated]
   │
   ▼
[View Home Dashboard] ──► (Lists assigned classes only)
   │
   ▼
[Select Class Card] 
   │
   ▼
[Select Target Date] (Defaults to today's date)
   │
   ├─► [Existing Record Found?] ── YES ──► Pre-populate previous statuses
   └─► [New Record?] ───────────── NO  ──► Pre-populate all as "Present" (Default)
   │
   ▼
[Adjust Attendance Statuses]
   │
   ├─► Option A: Click "Mark All Present" (Fills all as Present instantly)
   └─► Option B: Tap individual color-coded pills (Present, Sick, Excused, Absent)
   │
   ▼
[Click "Submit Attendance"]
   │
   ▼
[Simulated API Processing] ──► (Displays center Spinner for 1.2s delay)
   │
   ▼
[Success Splash Screen] ──► Shows success checkmark and submission summary
   │
   ▼
[Tap "Back to Dashboard"] ──► Returns to Home Class list (Updates global state)
```

---

## 3. Administrator Student Enrollment Flow

```
[Admin Tab: Manage Students]
   │
   ▼
[Click "Enroll Student"] ──► Triggers Add Student modal dialog
   │
   ▼
[Fill Modal Fields]
   ├─► Full Name (text, required)
   ├─► Roll ID (text, required; e.g. 10A01)
   ├─► Gender Selector (Male | Female | Other)
   ├─► Email Address (email, required; e.g. student@school.edu)
   └─► Class Cohort (dropdown selection of established classes)
   │
   ▼
[Click "Enroll Student" Submit]
   │
   ├──► [Form invalid or Roll ID duplicated?] ── YES ──► [Show red Alert banner in modal]
   └──► YES (Valid)
         │
         ▼
     [State Engine Update] ──► Appends student to global list
     [Modal Closes] ──► Table refreshes instantly; capacity calculations updated
```

---

## 4. Administrator Class Establishment Flow

```
[Admin Tab: Manage Classes]
   │
   ▼
[Click "Create New Class"] ──► Triggers Class setup modal
   │
   ▼
[Fill Modal Fields]
   ├─► Subject/Class Name (e.g., Grade 10 - Physics)
   ├─► Grade Level (e.g., 10)
   ├─► Room Allocation (e.g., Room 102)
   └─► Assign Principal Teacher (dropdown selection of available teachers)
   │
   ▼
[Click "Establish Class" Submit]
   │
   ├──► [Subject empty or Room missing?] ── YES ──► [Show Modal Validation error]
   └──► YES (Valid)
         │
         ▼
     [State Engine Update] ──► Adds class to grid
     [Modal Closes] ──► Class bento card appears; instructor metrics synchronized
```

---

## 5. Attendance Auditing & Excel Export Flow

```
[Admin Tab: Attendance Ledger]
   │
   ▼
[View Ledger Grid] ──► Shows detailed logs (Date, Class, Student, Roll ID, Status, Submitter)
   │
   ├─► [Perform Live Searching] (Type student name or Roll ID in search bar)
   ├─► [Apply Class Filter] (Dropdown selecting All or Class Cohorts)
   ├─► [Apply Status Filter] (Dropdown selecting All, Present, Sick, Excused, Absent)
   └─► [Apply Date Filter] (HTML Date Input limiting records to target date)
   │
   ▼
[Click "Export to Excel (CSV)"]
   │
   ▼
[Compile logs into tabular CSV format]
   │
   ▼
[Trigger Browser Download File] (Saves as `attendance_export_[current_date].csv`)
```

---

## 6. Real-Time Developer Sandbox Synchronization Flow

```
[View Application Port] 
   │
   ▼
[Open Sandbox Floating Controls] (Bottom-right panel)
   │
   ├─► Click "Act as Teacher: Robert Chen"
   │     │
   │     ▼
   │   - Screen switches instantly to Robert Chen's simulated iPad App.
   │   - Teacher marks "Ethan Harrison" as "Absent" and clicks "Submit".
   │
   └─► Click "Act as Admin"
         │
         ▼
       - Screen instantly reverts back to Super Admin Dashboard.
       - "Attendance Progression" chart, "System Overview" list, and 
         "Attendance Ledger" display Robert's new submission instantly.
```
