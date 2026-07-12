# ScholaSync - Operational Business Rules

This document specifies the core operational guidelines, validations, constraints, and cascade delete rules enforced within ScholaSync's internal state engine.

---

## 1. Student Entities & Validation Constraints

- **Single Class Placement:** Every student MUST be assigned to exactly one class. A student cannot be unassigned upon creation, though they can be reassigned during edit phases.
- **Roll Number Uniqueness:** Every student must possess a unique Roll ID / Registration Number (e.g., `10A01`, `11B04`).
  - *Validation Rule:* The Admin Student Creation form checks whether a newly entered Roll Number already exists in the global registry. If a match is found, the registration is blocked with an alert: `"Roll number is already assigned to another student."`
- **Email Validation:** Student email addresses must be structured properly (`username@domain.com`).
- **Gender Categorization:** Gender values are strictly constrained to one of the following enumerations: `Male`, `Female`, or `Other`.

---

## 2. Class Configurations & Faculty Allocations

- **One Instructor Limit:** A class cohort can be assigned at most one Primary Instructor (Teacher) at any time. A class can also have an unassigned state (`null` teacher ID).
- **Physical Room Isolation:** A class must be assigned a physical Room Allocation (e.g., `Room 302`, `Lab B`). Multiple classes are allowed to share rooms (signifying different periods), but each unique Class record possesses a single location string.
- **Grade Standards:** Grade levels are stored as text fields to accommodate mixed structures (e.g., `Grade 9`, `AP-11`, `12`).

---

## 3. Class Enrollment & Capacity Metrics

- **Max Threshold Warning:** Each class possesses a recommended maximum threshold of **30 enrolled students** (`Ratio: [Current]/30`).
- **Capacity Indicator:** While the system allows administrators to temporarily enroll more than 30 students for emergency overrides, the Class Bento card visually graphs capacity percentages and flags empty rosters:
  - *Capacity Progress Bar:* Renders `(Class Students Count / 30) * 100%`.
  - *Empty State warning:* Displays a prominent warning if a class roster is empty: `"Empty roster. Assign students under 'Manage Students'."`

---

## 4. Attendance Ledger & Roll Call Submissions

- **Ledger Uniqueness Rule:** There can only be **one** consolidated Attendance Record (`AttendanceRecord`) per Class per Date.
- **Attendance States:** A student's roll state on any date must belong to one of four rigid states:
  - **Present:** The student is actively attending the cohort. This is the default pre-populated status.
  - **Sick:** The student is reported ill.
  - **Excused:** The student has pre-authorized leave.
  - **Absent:** The student is missing without notice.
- **Audit Trails:** Every attendance submission logs the specific teacher ID who submitted the register (`submittedBy`) and the precise ISO timestamp of submission (`submittedAt`), enabling auditing.
- **Implicit Overwrite Rule:** If a teacher selects a date for which attendance was previously recorded and changes student statuses, clicking submit overwrites the pre-existing record rather than inserting duplicates, maintaining database integrity.

---

## 5. Cascade Deletion & Relational Rules

To avoid leaving orphans or causing system crashes, ScholaSync handles entity deletion through specific rules:

- **Student Deletion:** Removing a student completely wipes their profile from the global registry, immediately decrementing enrollment counts and adjusting analytical ratios in all dashboards. Historic logs remain unaffected or skip missing roll numbers.
- **Class Deletion (Safe Unassignment):** Deleting a class cohort does **not** delete its enrolled students. Instead, the system loops through all students belonging to that class and safely resets their `classId` reference to an unassigned status, preventing accidental cascading user deletion.
