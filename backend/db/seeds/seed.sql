-- Seed Data for ScholaSync PostgreSQL Database

-- 1. Insert Teachers
INSERT INTO teachers (id, name, email, subject) VALUES
('t1', 'Sarah Jenkins', 'sarah.j@school.edu', 'Mathematics'),
('t2', 'Robert Chen', 'r.chen@school.edu', 'Science'),
('t3', 'Emily Taylor', 'e.taylor@school.edu', 'English Literature'),
('t4', 'Marcus Sterling', 'm.sterling@school.edu', 'History');

-- 2. Insert Classes
INSERT INTO classes (id, name, grade, room, teacher_id) VALUES
('c1', 'Grade 10 - Mathematics', '10', 'Room 302', 't1'),
('c2', 'Grade 11 - Chemistry', '11', 'Lab B', 't2'),
('c3', 'Grade 9 - English', '9', 'Room 105', 't3'),
('c4', 'Grade 12 - World History', '12', 'Room 401', 't4');

-- 3. Insert Students
INSERT INTO students (id, name, roll_number, email, class_id, gender) VALUES
-- Class 1 (Grade 10 - Math)
('s1', 'Alexander Wright', '10A01', 'a.wright@school.edu', 'c1', 'Male'),
('s2', 'Olivia Martinez', '10A02', 'o.martinez@school.edu', 'c1', 'Female'),
('s3', 'Ethan Harrison', '10A03', 'e.harrison@school.edu', 'c1', 'Male'),
('s4', 'Sophia Patel', '10A04', 's.patel@school.edu', 'c1', 'Female'),
('s5', 'Liam Peterson', '10A05', 'l.peterson@school.edu', 'c1', 'Male'),

-- Class 2 (Grade 11 - Chem)
('s6', 'Emma Watson', '11B01', 'e.watson@school.edu', 'c2', 'Female'),
('s7', 'Noah Alvarez', '11B02', 'n.alvarez@school.edu', 'c2', 'Male'),
('s8', 'Ava Jenkins', '11B03', 'a.jenkins@school.edu', 'c2', 'Female'),
('s9', 'Jackson Brooks', '11B04', 'j.brooks@school.edu', 'c2', 'Male'),
('s10', 'Isabella Ross', '11B05', 'i.ross@school.edu', 'c2', 'Female'),

-- Class 3 (Grade 9 - English)
('s11', 'Lucas Foster', '09C01', 'l.foster@school.edu', 'c3', 'Male'),
('s12', 'Mia Campbell', '09C02', 'm.campbell@school.edu', 'c3', 'Female'),
('s13', 'Oliver Gray', '09C03', 'o.gray@school.edu', 'c3', 'Male'),
('s14', 'Charlotte Cole', '09C04', 'c.cole@school.edu', 'c3', 'Female'),

-- Class 4 (Grade 12 - History)
('s15', 'Mason Diaz', '12D01', 'm.diaz@school.edu', 'c4', 'Male'),
('s16', 'Harper King', '12D02', 'h.king@school.edu', 'c4', 'Female'),
('s17', 'Evelyn Scott', '12D03', 'e.scott@school.edu', 'c4', 'Female'),
('s18', 'William Murphy', '12D04', 'w.murphy@school.edu', 'c4', 'Male');

-- 4. Insert Initial Attendance Header Records (for 2026-07-10)
INSERT INTO attendance_records (id, class_id, date, submitted_by, submitted_at) VALUES
('att_c1_2026-07-10', 'c1', '2026-07-10', 't1', '2026-07-10 15:30:00+00'),
('att_c2_2026-07-10', 'c2', '2026-07-10', 't2', '2026-07-10 15:30:00+00'),
('att_c3_2026-07-10', 'c3', '2026-07-10', 't3', '2026-07-10 15:30:00+00'),
('att_c4_2026-07-10', 'c4', '2026-07-10', 't4', '2026-07-10 15:30:00+00');

-- 5. Insert Attendance Student Status Joins
INSERT INTO attendance_student_joins (attendance_id, student_id, status) VALUES
-- Class 1 Statuses
('att_c1_2026-07-10', 's1', 'Present'),
('att_c1_2026-07-10', 's2', 'Present'),
('att_c1_2026-07-10', 's3', 'Present'),
('att_c1_2026-07-10', 's4', 'Excused'),
('att_c1_2026-07-10', 's5', 'Present'),

-- Class 2 Statuses
('att_c2_2026-07-10', 's6', 'Present'),
('att_c2_2026-07-10', 's7', 'Absent'),
('att_c2_2026-07-10', 's8', 'Present'),
('att_c2_2026-07-10', 's9', 'Present'),
('att_c2_2026-07-10', 's10', 'Sick'),

-- Class 3 Statuses
('att_c3_2026-07-10', 's11', 'Present'),
('att_c3_2026-07-10', 's12', 'Present'),
('att_c3_2026-07-10', 's13', 'Present'),
('att_c3_2026-07-10', 's14', 'Present'),

-- Class 4 Statuses
('att_c4_2026-07-10', 's15', 'Present'),
('att_c4_2026-07-10', 's16', 'Present'),
('att_c4_2026-07-10', 's17', 'Present'),
('att_c4_2026-07-10', 's18', 'Present');
