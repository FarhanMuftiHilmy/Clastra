# ScholaSync - Detailed Implemented Features

This document details the functional capabilities currently implemented in the ScholaSync application.

---

## 1. Authentication & Developer Sandbox Selection

The authentication system (`AuthScreen.tsx`) provides role-based gateways with convenient shortcuts to ease simulation testing.

- **Role Selection Toggle:** Allows users to choose between **Admin Portal** and **Teacher App** paths. This adjusts input placeholders, labels, and helper accounts.
- **Form Validation:** Simple client-side form checking email format and requiring password entries before allowing access.
- **Developer Sandbox Credentials:**
  - Automatically lists available test teacher accounts (e.g., Sarah Jenkins - Math, Robert Chen - Science) with their emails and subjects.
  - Clicking any teacher button or the Admin credentials box pre-populates email and password, enabling instant one-click login.

---

## 2. Interactive Mobile Teacher App (`TeacherPortal.tsx`)

Simulates a modern, touch-optimized mobile experience for classroom instructors. The interface is enclosed in a realistic hardware iPad/phone mockup (`DeviceFrame.tsx`).

- **Dashboard Greeting:** Displays the instructor's first name, subject specialization, and current active date.
- **Assigned Class Selection:** Dynamically shows only classes assigned to the signed-in teacher. Each card exhibits class title, room number, and grade level.
- **Date Picker:** Let teachers choose the target date for the roll call. It automatically checks if attendance was already submitted for that date and loads previous choices if they exist.
- **Attendance Marking Roster:**
  - Lists students currently enrolled in the selected class.
  - Interactive grid displaying four color-coded status pills: **Present** (emerald), **Sick** (amber), **Excused** (blue), and **Absent** (red).
  - Touching any pill updates that student's state instantly in local memory.
- **Fast Action ("Mark All Present"):** A single-tap button to instantly set all students to "Present" to expedite roll calls.
- **API Simulated Submission:**
  - Clicking "Submit Attendance" displays a custom modal spinner simulating database write delay (1.2 seconds).
  - Displays a dedicated "Marking Success" screen upon completion, complete with checkmark animations and a prompt to return to class selection.

---

## 3. High-Density Admin Dashboard (`AdminDashboard.tsx`)

A desktop-first web workspace offering full analytical overview and CRUD operations over classes and students, split across 5 distinct tabs.

### A. System Overview Tab
- **KPI Metrics Cards:** Displays total student enrollment count, configured classes count, submission records count, and teacher roster size.
- **Real-Time Submissions Feed:** Chronological vertical timeline displaying today's attendance submissions (which classes submitted, teacher name, status, and timestamp).
- **Class Configuration Overview:** Fast list of classes, assigned rooms, and assigned instructors.

### B. Student Management Directory
- **Student Database Table:** Shows columns for Name, Roll ID, Email, Assigned Class, Gender, and Actions.
- **Fuzzy Search:** Filter students instantly by typing partial names, roll numbers, or emails.
- **Class Filter Dropdown:** Limits table entries to students of a specific class.
- **Pagination Controls:** Supports standard client-side pagination (default: 8 records per page) with Prev/Next buttons and numbered pages.
- **Enrollment CRUD Modals:**
  - **Create Student:** Fully validated modal form with fields for Full Name, Roll ID, Gender, Email, and Class.
  - **Edit Student:** Pre-populates fields allowing changes to personal attributes or class re-allocation.
  - **Delete Student:** Triggers a native alert confirmation preventing accidental student removal.

### C. Class Management Bento Grid
- **Bento Card Layout:** Displays each class in a styled box outlining grade levels, room locations, teacher assignments, student roster lists, and ratio bars.
- **Class Search:** Filters class cards by subject, grade level, room number, or assigned teacher name.
- **Roster Capacity Meter:** Renders a horizontal capacity progress bar (current enrollment out of a standard maximum 30-student limit).
- **Class CRUD Modals:**
  - **Create Class:** Modal form to specify subject, grade level, room, and assign a teacher from the existing instructor pool.
  - **Edit Class:** Modify any parameter (e.g., reallocating room or shifting class to a different teacher).
  - **Delete Class:** Warns administrators that deleting a class will safely unassign its students, then removes the class record.

### D. Attendance Ledger Log
- **Multi-Filter Spreadsheet:** Tabular output of all student-level attendance logs.
- **Active Search:** Search by student name or roll ID.
- **Drop-Down Multi-Filters:** Filter logs simultaneously by Class, Date (via Calendar input), and Attendance Status.
- **Excel (CSV) Exporter:** Generates and triggers download of a standardized CSV file with headers: `Date`, `Class Name`, `Student Name`, `Roll Number`, `Status`, `Submitted By`.

### E. Analytical Insights Tab
- **Line Chart (Attendance Rate):** Interactive Recharts `LineChart` graphing school-wide daily attendance percentages over the past 5 weekdays.
- **Bar Chart (Class Enrollments):** Recharts `BarChart` comparing current student roster sizes against each other.
- **Gender Balance Gauge:** Dynamically calculates count and percentage metrics for Male, Female, and Other students, visualized through filled progress indicators.
- **System Integrity Summary:** Audit breakdown summarizing total record count and capacity ratio (total enrollment vs. 120-seat threshold).

---

## 4. Sandbox Quick Controls

A floating component (`App.tsx`) available in development mode to assist developers with sandbox synchronization tests:
- Displays current user role.
- Includes quick-swap buttons (**Act as Admin** or **Act as Teacher**) that let the simulator bypass the login screen entirely.
- Explains role synchronization flow.
