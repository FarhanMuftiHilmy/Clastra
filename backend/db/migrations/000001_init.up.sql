-- ScholaSync Relational Schema Migration

-- A. Create Teachers Profile Table
CREATE TABLE teachers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    subject VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- B. Create Classes Table with Teacher Relationship
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

-- C. Create Students Table with Class Assignment and Constraints
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

-- D. Create Attendance Header Record
CREATE TABLE attendance_records (
    id VARCHAR(100) PRIMARY KEY, -- Composite format: att_<class_id>_<date>
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

-- E. Create Attendance Student Status Joins (Bridge Table)
CREATE TABLE attendance_student_joins (
    attendance_id VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Sick', 'Excused', 'Absent')),
    
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

-- F. Indices for Rapid Query Response & Query Coverage
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_students_search ON students (name, roll_number);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_composite ON attendance_records(class_id, date);
CREATE INDEX idx_attendance_joins_student ON attendance_student_joins(student_id);
