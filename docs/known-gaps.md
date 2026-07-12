# ScholaSync - Known Gaps and Technical Debts

This document outlines structural missing links, functional gaps, and potential roadmap enhancements identified in the current implementation of ScholaSync.

---

## 1. Volatile In-Memory Storage (Lack of Persistence)

- **Gap Description:** The system states (`students`, `classes`, `attendanceRecords`, `currentUser`) reside purely in volatile React component memory.
- **Consequence:** Performing a hard browser refresh or clearing the cache resets the entire school directory and wipe any daily attendance lists submitted during testing.
- **Solution:** 
  - *Short-Term:* Integrate standard client-side `localStorage` or `sessionStorage` hooks to preserve changes across reload actions.
  - *Long-Term:* Integrate Firebase Firestore database tables for persistent cloud storage.

---

## 2. Mock Authentication & Weak Security Rules

- **Gap Description:** The login system (`AuthScreen.tsx`) compares credentials directly against client-side arrays in plain-text without secured handshakes, password hashing, or JWT tokenization.
- **Consequence:** Vulnerable to tampering. Anyone can inspect client-side bundles to harvest emails.
- **Solution:** Provision actual database authentication (such as Firebase Auth or a custom OAuth2 passport gateway).

---

## 3. Absence of Teacher Profile Management (No Teacher CRUD)

- **Gap Description:** While administrators can fully CRUD students and classes, they cannot manage faculty profiles. Teachers are hardcoded in `data.ts`.
- **Consequence:** To recruit a new instructor or fire a staff member, administrators have to edit source code.
- **Solution:** Add a 6th navigation tab in the Administrator Dashboard titled **"Manage Teachers"** containing full CRUD capabilities.

---

## 4. Lack of Physical Room Allocation Checks (Room Overlaps)

- **Gap Description:** The class creation modal allows assigning any room name.
- **Consequence:** Multiple classes can be set up in the same room (e.g. "Lab B") on identical grades/periods without triggering collision warnings.
- **Solution:** Implement a validation rule checking for room allocation overlaps before permitting class establishment.

---

## 5. Administrators Cannot Override Attendance Records

- **Gap Description:** While administrators can view the logs and export spreadsheets, they cannot edit submitted logs directly.
- **Consequence:** If a teacher submits an incorrect roll status, the teacher must log back into their account, select the correct date, make the change, and re-submit. The admin cannot correct records directly.
- **Solution:** Add an "Edit Record" button inside the **Attendance Ledger Log** table for Super Admins.

---

## 6. Email Uniqueness Enforcement is Missing

- **Gap Description:** While Roll ID uniqueness is partially checked on form submission, student email addresses are not checked for duplication.
- **Consequence:** Multiple students can be registered with the exact same email address (e.g., `test@school.edu`).
- **Solution:** Implement a duplicate check validation for email addresses alongside Roll IDs in the enrollment modal.

---

## 7. No Individual Student Attendance Score Cards

- **Gap Description:** The reports dashboard provides beautiful high-level aggregate trends (trends, distributions), but lacks student-specific scorecards.
- **Consequence:** Administrators cannot quickly pinpoint specific students suffering from chronic absenteeism or calculate individual attendance percentages.
- **Solution:** Clicking on a student in the student directory table should open an individual drawer showcasing their personal attendance percentage (e.g., "94.2%"), a monthly calendar grid of absences, and contact detail shortcuts.
