/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Teacher, Class, Student, AttendanceRecord } from './types';

export const INITIAL_TEACHERS: Teacher[] = [
  { id: 't1', name: 'Sarah Jenkins', email: 'sarah.j@school.edu', subject: 'Mathematics' },
  { id: 't2', name: 'Robert Chen', email: 'r.chen@school.edu', subject: 'Science' },
  { id: 't3', name: 'Emily Taylor', email: 'e.taylor@school.edu', subject: 'English Literature' },
  { id: 't4', name: 'Marcus Sterling', email: 'm.sterling@school.edu', subject: 'History' },
];

export const INITIAL_CLASSES: Class[] = [
  { id: 'c1', name: 'Grade 10 - Mathematics', grade: '10', room: 'Room 302', teacherId: 't1' },
  { id: 'c2', name: 'Grade 11 - Chemistry', grade: '11', room: 'Lab B', teacherId: 't2' },
  { id: 'c3', name: 'Grade 9 - English', grade: '9', room: 'Room 105', teacherId: 't3' },
  { id: 'c4', name: 'Grade 12 - World History', grade: '12', room: 'Room 401', teacherId: 't4' },
];

export const INITIAL_STUDENTS: Student[] = [
  // Class 1 (Grade 10 - Math)
  { id: 's1', name: 'Alexander Wright', rollNumber: '10A01', email: 'a.wright@school.edu', classId: 'c1', gender: 'Male' },
  { id: 's2', name: 'Olivia Martinez', rollNumber: '10A02', email: 'o.martinez@school.edu', classId: 'c1', gender: 'Female' },
  { id: 's3', name: 'Ethan Harrison', rollNumber: '10A03', email: 'e.harrison@school.edu', classId: 'c1', gender: 'Male' },
  { id: 's4', name: 'Sophia Patel', rollNumber: '10A04', email: 's.patel@school.edu', classId: 'c1', gender: 'Female' },
  { id: 's5', name: 'Liam Peterson', rollNumber: '10A05', email: 'l.peterson@school.edu', classId: 'c1', gender: 'Male' },

  // Class 2 (Grade 11 - Chem)
  { id: 's6', name: 'Emma Watson', rollNumber: '11B01', email: 'e.watson@school.edu', classId: 'c2', gender: 'Female' },
  { id: 's7', name: 'Noah Alvarez', rollNumber: '11B02', email: 'n.alvarez@school.edu', classId: 'c2', gender: 'Male' },
  { id: 's8', name: 'Ava Jenkins', rollNumber: '11B03', email: 'a.jenkins@school.edu', classId: 'c2', gender: 'Female' },
  { id: 's9', name: 'Jackson Brooks', rollNumber: '11B04', email: 'j.brooks@school.edu', classId: 'c2', gender: 'Male' },
  { id: 's10', name: 'Isabella Ross', rollNumber: '11B05', email: 'i.ross@school.edu', classId: 'c2', gender: 'Female' },

  // Class 3 (Grade 9 - English)
  { id: 's11', name: 'Lucas Foster', rollNumber: '09C01', email: 'l.foster@school.edu', classId: 'c3', gender: 'Male' },
  { id: 's12', name: 'Mia Campbell', rollNumber: '09C02', email: 'm.campbell@school.edu', classId: 'c3', gender: 'Female' },
  { id: 's13', name: 'Oliver Gray', rollNumber: '09C03', email: 'o.gray@school.edu', classId: 'c3', gender: 'Male' },
  { id: 's14', name: 'Charlotte Cole', rollNumber: '09C04', email: 'c.cole@school.edu', classId: 'c3', gender: 'Female' },

  // Class 4 (Grade 12 - History)
  { id: 's15', name: 'Mason Diaz', rollNumber: '12D01', email: 'm.diaz@school.edu', classId: 'c4', gender: 'Male' },
  { id: 's16', name: 'Harper King', rollNumber: '12D02', email: 'h.king@school.edu', classId: 'c4', gender: 'Female' },
  { id: 's17', name: 'Evelyn Scott', rollNumber: '12D03', email: 'e.scott@school.edu', classId: 'c4', gender: 'Female' },
  { id: 's18', name: 'William Murphy', rollNumber: '12D04', email: 'w.murphy@school.edu', classId: 'c4', gender: 'Male' },
];

// Helper to generate attendance over the last 5 weekdays
export function generateInitialAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const dates = [
    '2026-07-06', // Mon
    '2026-07-07', // Tue
    '2026-07-08', // Wed
    '2026-07-09', // Thu
    '2026-07-10', // Fri
  ];

  // Helper arrays for random selection
  const statuses: ('Present' | 'Sick' | 'Excused' | 'Absent')[] = [
    'Present', 'Present', 'Present', 'Present', 'Present', // higher probability
    'Present', 'Present', 'Present', 'Present', 'Present',
    'Present', 'Present', 'Present', 'Present', 'Present',
    'Present', 'Present', 'Present', 'Present', 'Present',
    'Present', 'Present', 'Present', 'Present', 'Present',
    'Present', 'Present', 'Present', 'Present', 'Present',
    'Sick', 'Excused', 'Absent', 'Present', 'Present'
  ];

  INITIAL_CLASSES.forEach((cls) => {
    // For each date, create a record
    dates.forEach((date, dateIdx) => {
      const classStudents = INITIAL_STUDENTS.filter((s) => s.classId === cls.id);
      if (classStudents.length === 0) return;

      const studentAttendances = classStudents.map((student) => {
        // Deterministic but varied status per student and date to keep charts beautiful
        const charSum = student.name.charCodeAt(0) + dateIdx;
        const status = statuses[charSum % statuses.length];
        return {
          studentId: student.id,
          status,
        };
      });

      records.push({
        id: `att_${cls.id}_${date}`,
        classId: cls.id,
        date,
        submittedBy: cls.teacherId || 't1',
        submittedAt: `${date}T15:30:00.000Z`,
        students: studentAttendances,
      });
    });
  });

  return records;
}
