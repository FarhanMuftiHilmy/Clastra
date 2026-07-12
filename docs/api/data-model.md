# ScholaSync - PostgreSQL Data Model

This document specifies the relational database schema design for the future **PostgreSQL** storage engine supporting the Go REST API.

---

## 1. Entity-Relationship Diagram (Logical Model)

```
  ┌───────────────────┐               ┌───────────────────┐
  │     teachers      │ 1           1 │      classes      │
  ├───────────────────┼──────────────>├───────────────────┤
  │ PK id (VARCHAR)   │               │ PK id (VARCHAR)   │
  │    name           │               │    name           │
  │    email (UNIQUE) │               │    grade          │
  │    subject        │               │    room           │
  └───────────────────┘               │ FK teacher_id     │
            │                         └─────────┬─────────┘
            │                                   │
            │                                   │ 1
            │ 1                                 │
            ▼                                   ▼ 1..*
  ┌─────────────────────────┐         ┌───────────────────┐
  │    attendance_records   │         │     students      │
  ├─────────────────────────┤         ├───────────────────┤
  │ PK id (VARCHAR)         │         │ PK id (VARCHAR)   │
  │ FK class_id (CASCADE)   │         │    name           │
  │    date (DATE)          │         │    roll_number    │
  │ FK submitted_by         │         │    email          │
  │    submitted_at         │         │ FK class_id (SET_NULL)
  └─────────┬───────────────┘         │    gender         │
            │                         └─────────┬─────────┘
            │ 1                                 │
            ▼                                   ▼ 1
  ┌───────────────────────────────────────────────────────┐
  │               attendance_student_joins                │
  ├───────────────────────────────────────────────────────┤
  │ PK, FK attendance_id (CASCADE)                        │
  │ PK, FK student_id (CASCADE)                           │
  │        status (ENUM: Present, Sick, Excused, Absent)  │
  └───────────────────────────────────────────────────────┘
```

---

## 2. Table Schemas (DDL blueprint)

### A. `teachers`
Holds the profiles of instructional staff.

```sql
CREATE TABLE teachers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    subject VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### B. `classes`
Represents standard classrooms and links them to a supervising teacher.

```sql
CREATE TABLE classes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    room VARCHAR(50) NOT NULL,
    teacher_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_class_teacher 
        FOREIGN KEY (teacher_id) 
        REFERENCES teachers(id) 
        ON DELETE SET NULL
);
```

### C. `students`
Stores individual student profiles with a nullable foreign key pointing to their assigned class.

```sql
CREATE TABLE students (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL,
    class_id VARCHAR(50),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_student_class 
        FOREIGN KEY (class_id) 
        REFERENCES classes(id) 
        ON DELETE SET NULL
);
```

### D. `attendance_records`
A header record representing a daily attendance sheet for a specific class on a specific date.

```sql
CREATE TABLE attendance_records (
    id VARCHAR(100) PRIMARY KEY, -- Schema: 'att_' + class_id + '_' + date
    class_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    submitted_by VARCHAR(50) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_attendance_class 
        FOREIGN KEY (class_id) 
        REFERENCES classes(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_attendance_teacher 
        FOREIGN KEY (submitted_by) 
        REFERENCES teachers(id) 
        ON DELETE RESTRICT,
        
    CONSTRAINT uq_class_date 
        UNIQUE (class_id, date)
);
```

### E. `attendance_student_joins`
A bridge table resolving the many-to-many relationship between attendance records and individual students.

```sql
CREATE TYPE attendance_status_enum AS ENUM ('Present', 'Sick', 'Excused', 'Absent');

CREATE TABLE attendance_student_joins (
    attendance_id VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    status attendance_status_enum NOT NULL,
    
    PRIMARY KEY (attendance_id, student_id),
    
    CONSTRAINT fk_join_attendance 
        FOREIGN KEY (attendance_id) 
        REFERENCES attendance_records(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_join_student 
        FOREIGN KEY (student_id) 
        REFERENCES students(id) 
        ON DELETE CASCADE
);
```

---

## 3. High-Performance Indexing Strategy

To keep search parameters fast as the school scales to tens of thousands of active logs:

```sql
-- Fast lookup for query parameters inside directories:
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);

-- Speed up search-bar matching for names/rolls:
CREATE INDEX idx_students_search ON students USING btree (name, roll_number);

-- Highly optimized coverage for historical attendance reports:
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_composite ON attendance_records(class_id, date);

-- Fast cascading deletions for student records:
CREATE INDEX idx_attendance_joins_student ON attendance_student_joins(student_id);
```
