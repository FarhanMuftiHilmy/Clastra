-- 000002_student_class_joins.up.sql
-- Add join table to allow students to be enrolled in multiple classes

CREATE TABLE IF NOT EXISTS student_class_joins (
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, class_id)
);

-- Backfill existing data: if students have class_id set, create join records
INSERT INTO student_class_joins (student_id, class_id)
SELECT id, class_id FROM students WHERE class_id IS NOT NULL AND class_id <> '';

-- Note: keep students.class_id for backward compatibility. Later migration can drop it.
