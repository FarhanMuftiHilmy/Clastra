# ScholaSync - Endpoint Documentation

This document describes the human-readable endpoint specification for the Go REST API.

---

## 1. Authentication Endpoints

### A. POST `/auth/login`
- **Purpose:** Logs a user in and issues a secure session.
- **Access Level:** Public.
- **Request Body:**
  ```json
  {
    "role": "admin",
    "email": "admin@school.edu",
    "password": "password123"
  }
  ```
- **Validation Rules:**
  - `role` must be either `admin` or `teacher`.
  - `email` must be a valid email format.
  - `password` is required (minimum 6 characters).
- **Response Body (`200 OK`):**
  ```json
  {
    "role": "admin",
    "id": "admin_1",
    "name": "Principal Arthur",
    "email": "admin@school.edu"
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: Invalid credentials.
  - `422 Unprocessable Entity`: Form validation failure.

### B. POST `/auth/logout`
- **Purpose:** Destroys client session cookies or tokens.
- **Access Level:** Authenticated.
- **Response Body (`200 OK`):**
  ```json
  {
    "message": "Logout successful"
  }
  ```

---

## 2. Student Directory Endpoints

### A. GET `/students`
- **Purpose:** Fetches all student records. Supports searching and class filtration.
- **Access Level:** Authenticated (Admins and Teachers).
- **Request Parameters:**
  - `search` (Query, String, Optional): Matches student Name, Roll ID, or Email.
  - `classId` (Query, String, Optional): Filters records by Class ID.
- **Response Body (`200 OK`):**
  ```json
  [
    {
      "id": "std_1",
      "name": "Ethan Harrison",
      "rollNumber": "10A01",
      "email": "ethan.h@school.edu",
      "classId": "cls_1",
      "gender": "Male"
    }
  ]
  ```

### B. POST `/students`
- **Purpose:** Enrolls a new student.
- **Access Level:** Admins Only.
- **Request Body:**
  ```json
  {
    "name": "Gavin Reed",
    "rollNumber": "10A05",
    "email": "gavin.reed@school.edu",
    "classId": "cls_1",
    "gender": "Male"
  }
  ```
- **Validation Rules:**
  - `name`, `rollNumber`, `email`, `classId`, and `gender` are strictly required.
  - `rollNumber` must be unique across the entire system.
  - `gender` must be `Male`, `Female`, or `Other`.
- **Response Body (`201 Created`):**
  ```json
  {
    "id": "std_105",
    "name": "Gavin Reed",
    "rollNumber": "10A05",
    "email": "gavin.reed@school.edu",
    "classId": "cls_1",
    "gender": "Male"
  }
  ```
- **Error Codes:**
  - `409 Conflict`: If the `rollNumber` is already assigned to another student.

### C. PUT `/students/{id}`
- **Purpose:** Updates an existing student's profile.
- **Access Level:** Admins Only.
- **Request Body:** Same schema as POST `/students` but with optional `id`.
- **Response Body (`200 OK`):** Returns the fully updated Student object.
- **Error Codes:**
  - `404 Not Found`: If student ID doesn't exist.
  - `409 Conflict`: If the updated `rollNumber` conflicts with another student.

### D. DELETE `/students/{id}`
- **Purpose:** Deletes a student from the system.
- **Access Level:** Admins Only.
- **Response Body (`204 No Content`):** Empty body.
- **Relational Integrity Rules:**
  - Removing a student automatically removes all their individual entries inside historical `AttendanceRecords` (scrubbed on the server).

---

## 3. Class Management Endpoints

### A. GET `/classes`
- **Purpose:** Retrieves all classes in the school.
- **Access Level:** Authenticated.
- **Response Body (`200 OK`):**
  ```json
  [
    {
      "id": "cls_1",
      "name": "Grade 10 - Geometry",
      "grade": "10",
      "room": "Room 402",
      "teacherId": "t1"
    }
  ]
  ```

### B. POST `/classes`
- **Purpose:** Establishes a new class cohort.
- **Access Level:** Admins Only.
- **Request Body:**
  ```json
  {
    "name": "Grade 11 - Chemistry",
    "grade": "11",
    "room": "Lab B",
    "teacherId": "t2"
  }
  ```
- **Validation Rules:**
  - `name`, `grade`, and `room` are required fields.
- **Response Body (`201 Created`):** Returns the newly created Class entity.

### C. PUT `/classes/{id}`
- **Purpose:** Edits class specifications (reallocates rooms or updates assigned teachers).
- **Access Level:** Admins Only.
- **Response Body (`200 OK`):** Fully updated Class object.

### D. DELETE `/classes/{id}`
- **Purpose:** Removes a class.
- **Access Level:** Admins Only.
- **Response Body (`204 No Content`)**
- **Relational Integrity Rules:**
  - Deleting a class automatically resets the `classId` of all enrolled students to `""` (unassigned) rather than deleting the students themselves.
  - Deletes all historical `AttendanceRecords` associated with this class.

---

## 4. Teacher Registry Endpoints

### A. GET `/teachers`
- **Purpose:** Fetches the full teacher registry.
- **Access Level:** Authenticated.
- **Response Body (`200 OK`):**
  ```json
  [
    {
      "id": "t1",
      "name": "Sarah Jenkins",
      "email": "sarah.j@school.edu",
      "subject": "Mathematics"
    }
  ]
  ```

---

## 5. Attendance Ledger Endpoints

### A. GET `/attendance`
- **Purpose:** Queries school attendance records. Supports querying by Class, Date, and Status filters.
- **Access Level:** Authenticated.
- **Request Parameters:**
  - `classId` (Query, String, Optional): Filters logs for a specific class.
  - `date` (Query, String, Optional): Filters for a specific date (YYYY-MM-DD format).
- **Response Body (`200 OK`):**
  ```json
  [
    {
      "id": "att_cls_1_2026-07-12",
      "classId": "cls_1",
      "date": "2026-07-12",
      "submittedBy": "t1",
      "submittedAt": "2026-07-12T08:30:00Z",
      "students": [
        {
          "studentId": "std_1",
          "status": "Present"
        },
        {
          "studentId": "std_2",
          "status": "Absent"
        }
      ]
    }
  ]
  ```

### B. POST `/attendance`
- **Purpose:** Records or completely overwrites a class register for a specific date (Upsert).
- **Access Level:** Authenticated (primarily Teachers/Admins).
- **Request Body:**
  ```json
  {
    "classId": "cls_1",
    "date": "2026-07-12",
    "submittedBy": "t1",
    "students": [
      {
        "studentId": "std_1",
        "status": "Present"
      },
      {
        "studentId": "std_2",
        "status": "Sick"
      }
    ]
  }
  ```
- **Response Body (`201 Created` or `200 OK`):** Fully saved AttendanceRecord schema containing generated `id` and updated `submittedAt` timestamps.
